import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireBackupAdmin, BackupAuthError } from "@/lib/backup/auth";
import { verifyChecksum } from "@/lib/backup/export";
import { executeRestore, planRestore } from "@/lib/backup/restore";
import {
  MAX_RESTORE_BYTES,
  RestoreRequestSchema,
} from "@/lib/backup/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CONFIRM_PHRASE = "RESTORE";

/**
 * POST /api/admin/restore
 * Body: { backup: BackupFile, dryRun: boolean, confirm?: "RESTORE" }
 * - dryRun=true (default): validate + plan, no writes.
 * - dryRun=false + confirm="RESTORE": destructive transactional restore.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let adminEmail = "unknown";
  try {
    const admin = await requireBackupAdmin();
    adminEmail = admin.email ?? admin.userId;

    const rawText = await req.text();
    if (rawText.length > MAX_RESTORE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Backup file too large (max 50 MB)." },
        { status: 413 },
      );
    }

    let raw: unknown;
    try {
      raw = JSON.parse(rawText) as unknown;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON — upload the .json backup file (not .sql/.zip)." },
        { status: 400 },
      );
    }

    const body = (raw as { backup?: unknown; dryRun?: unknown; confirm?: unknown }).backup
      ? (raw as { backup: unknown; dryRun?: unknown; confirm?: unknown })
      : { backup: raw, dryRun: true };

    const parsed = RestoreRequestSchema.safeParse({
      backup: body.backup,
      confirm: typeof body.confirm === "string" ? body.confirm : undefined,
      dryRun: body.dryRun !== false,
    });
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Backup validation failed.",
          details: parsed.error.flatten(),
        },
        { status: 422 },
      );
    }

    const { backup, dryRun, confirm } = parsed.data;

    if (!verifyChecksum(backup)) {
      return NextResponse.json(
        {
          success: false,
          error: "Checksum mismatch — file is corrupted or modified. Restore refused.",
        },
        { status: 422 },
      );
    }

    const plan = planRestore(backup);

    if (dryRun) {
      return NextResponse.json(
        {
          success: true,
          dryRun: true,
          plan,
          message: `Dry-run OK: ${plan.totalRows} rows across ${plan.perTable.length} tables. Re-run with confirm "${CONFIRM_PHRASE}" to restore.`,
        },
        { status: 200 },
      );
    }

    if (confirm !== CONFIRM_PHRASE) {
      return NextResponse.json(
        {
          success: false,
          error: `Confirmation required — send confirm: "${CONFIRM_PHRASE}" with dryRun: false.`,
        },
        { status: 400 },
      );
    }

    if (!plan.checksumValid || plan.blockers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Restore blocked: ${plan.blockers.join(" ")}`,
          blockers: plan.blockers,
          warnings: plan.warnings,
        },
        { status: 422 },
      );
    }

    const inserted = await executeRestore(backup);
    const totalInserted = Object.values(inserted).reduce((n, c) => n + c, 0);

    console.error("Backup restore completed:", {
      at: new Date().toISOString(),
      by: adminEmail,
      rows: totalInserted,
      checksum: backup.checksumSha256,
    });

    return NextResponse.json(
      {
        success: true,
        dryRun: false,
        inserted,
        totalInserted,
        restoredAt: new Date().toISOString(),
        restoredBy: adminEmail,
        receipt: {
          backupExportedAt: backup.exportedAt,
          backupExportedBy: backup.exportedBy,
          checksumSha256: backup.checksumSha256,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof BackupAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof z.ZodError) {
      // Request bodies are validated with safeParse above, so a thrown ZodError
      // comes from server env validation (lib/config.ts), not from the upload.
      const fields = error.issues.map((i) => i.path.join(".")).join(", ");
      console.error("Backup restore blocked by server configuration:", { fields, by: adminEmail });
      return NextResponse.json(
        {
          success: false,
          error: `Server configuration error (${fields}). Fix the deployment environment and redeploy — the backup was not touched.`,
        },
        { status: 500 },
      );
    }
    const message = error instanceof Error ? error.message : "Restore failed.";
    console.error("Backup restore failed:", {
      message,
      by: adminEmail,
      at: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, error: "Restore failed and was rolled back. No partial writes." },
      { status: 500 },
    );
  }
}
