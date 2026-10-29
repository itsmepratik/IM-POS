import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { requireBackupAdmin, BackupAuthError } from "@/lib/backup/auth";
import {
  backupFilename,
  buildBackupFile,
  collectAllTables,
  manifestCsv,
  toCsv,
  toSqlDump,
} from "@/lib/backup/export";
import { BACKUP_TABLES } from "@/lib/backup/manifest";
import { BackupQuerySchema } from "@/lib/backup/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/admin/backup?format=json|sql|csv-zip
 * Full-system logical backup, admin-only, download-only (nothing stored server-side).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  let adminEmail = "unknown";
  try {
    const admin = await requireBackupAdmin();
    adminEmail = admin.email ?? admin.userId;

    const parsed = BackupQuerySchema.safeParse({
      format: req.nextUrl.searchParams.get("format") ?? "json",
    });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid format. Use json, sql, or csv-zip." },
        { status: 400 },
      );
    }
    const format = parsed.data.format;

    const collected = await collectAllTables();
    const backup = buildBackupFile(collected, adminEmail);
    const filename = backupFilename(format);

    if (format === "json") {
      const body = JSON.stringify(backup);
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Backup-Checksum": backup.checksumSha256,
          "X-Backup-Rows": String(backup.totalRows),
          "X-Backup-Version": String(backup.version),
          "Cache-Control": "no-store",
        },
      });
    }

    if (format === "sql") {
      const sql = toSqlDump(backup);
      return new NextResponse(sql, {
        status: 200,
        headers: {
          "Content-Type": "application/sql; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Backup-Checksum": backup.checksumSha256,
          "X-Backup-Rows": String(backup.totalRows),
          "Cache-Control": "no-store",
        },
      });
    }

    // csv-zip: one CSV per table + manifest + canonical JSON for restore
    const zip = new JSZip();
    zip.file("im-pos-backup.json", JSON.stringify(backup));
    zip.file("_manifest.csv", manifestCsv(backup));
    for (const entry of BACKUP_TABLES) {
      const rows = backup.tables[entry.key] ?? [];
      zip.file(`${entry.key}.csv`, toCsv(entry.key, rows));
    }
    const buffer: Buffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    const bytes = new Uint8Array(buffer);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Backup-Checksum": backup.checksumSha256,
        "X-Backup-Rows": String(backup.totalRows),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof BackupAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Backup failed unexpectedly.";
    console.error("Backup export failed:", {
      message,
      at: new Date().toISOString(),
    });
    const status =
      /timed out|timeout/i.test(message) || /not initialized/i.test(message)
        ? 503
        : 500;
    return NextResponse.json(
      {
        success: false,
        error:
          status === 503
            ? "Database unavailable or backup timed out — try again."
            : "Backup failed. Try again; if it persists, use the CLI script.",
      },
      { status },
    );
  }
}
