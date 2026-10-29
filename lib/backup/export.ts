/**
 * Server-only backup collection + serialization (JSON / SQL / CSV).
 * Uses the direct Drizzle connection (bypasses RLS by design — full dump).
 * NEVER import from a Client Component.
 */

import { createHash } from "node:crypto";
import { getDatabase, withTimeout, DB_TIMEOUT_MS } from "@/lib/db/client";
import {
  BACKUP_TABLES,
  BACKUP_VERSION,
  getDrizzleTable,
  type BackupFile,
  type BackupTableKey,
} from "./manifest";

export type BackupFormat = "json" | "sql" | "csv-zip";

export interface CollectedBackup {
  tables: Record<string, Record<string, unknown>[]>;
  rowCounts: Record<string, number>;
  totalRows: number;
}

const PER_TABLE_TIMEOUT_MS = DB_TIMEOUT_MS;

/** Normalize Drizzle values (Date/numeric objects) into JSON-safe primitives. */
function normalizeValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  return value;
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = normalizeValue(v);
  }
  return out;
}

/** Collect every table sequentially (low memory pressure, FK-safe order). */
export async function collectAllTables(): Promise<CollectedBackup> {
  const db = getDatabase();
  if (!db) {
    throw new Error("Database client not initialized — check DATABASE_URL.");
  }
  const tables: Record<string, Record<string, unknown>[]> = {};
  const rowCounts: Record<string, number> = {};
  let totalRows = 0;

  for (const entry of BACKUP_TABLES) {
    const table = getDrizzleTable(entry.key as BackupTableKey);
    const rows = (await withTimeout(
      (db.select().from(table as never) as unknown as Promise<Record<string, unknown>[]>),
      PER_TABLE_TIMEOUT_MS,
      `backup ${entry.key}`,
    )) as Record<string, unknown>[];
    const normalized = rows.map(normalizeRow);
    tables[entry.key] = normalized;
    rowCounts[entry.key] = normalized.length;
    totalRows += normalized.length;
  }

  return { tables, rowCounts, totalRows };
}

/** Canonical payload used for the checksum (stable key order, counts included). */
function canonicalPayload(
  tables: Record<string, Record<string, unknown>[]>,
  rowCounts: Record<string, number>,
  totalRows: number,
): string {
  const orderedTables: Record<string, Record<string, unknown>[]> = {};
  const orderedCounts: Record<string, number> = {};
  for (const entry of BACKUP_TABLES) {
    orderedTables[entry.key] = tables[entry.key] ?? [];
    orderedCounts[entry.key] = rowCounts[entry.key] ?? 0;
  }
  return JSON.stringify({
    version: BACKUP_VERSION,
    tables: orderedTables,
    rowCounts: orderedCounts,
    totalRows,
  });
}

export function computeChecksum(
  tables: Record<string, Record<string, unknown>[]>,
  rowCounts: Record<string, number>,
  totalRows: number,
): string {
  return createHash("sha256").update(canonicalPayload(tables, rowCounts, totalRows)).digest("hex");
}

export function verifyChecksum(backup: BackupFile): boolean {
  const orderedTables: Record<string, Record<string, unknown>[]> = {};
  for (const entry of BACKUP_TABLES) {
    const rows = backup.tables[entry.key];
    if (!Array.isArray(rows)) return false;
    orderedTables[entry.key] = rows;
  }
  const recomputed = createHash("sha256")
    .update(
      JSON.stringify({
        version: backup.version,
        tables: orderedTables,
        rowCounts: Object.fromEntries(
          BACKUP_TABLES.map((e) => [e.key, backup.rowCounts[e.key] ?? 0]),
        ),
        totalRows: backup.totalRows,
      }),
    )
    .digest("hex");
  return recomputed === backup.checksumSha256;
}

export function buildBackupFile(
  collected: CollectedBackup,
  exportedBy: string,
): BackupFile {
  const checksumSha256 = computeChecksum(
    collected.tables,
    collected.rowCounts,
    collected.totalRows,
  );
  return {
    kind: "im-pos-full-backup",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy,
    rowCounts: collected.rowCounts,
    totalRows: collected.totalRows,
    checksumSha256,
    tables: collected.tables,
  };
}

export function backupFilename(format: BackupFormat, at: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  const stamp = `${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}-${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}${pad(at.getUTCSeconds())}`;
  if (format === "json") return `im-pos-backup-${stamp}.json`;
  if (format === "sql") return `im-pos-backup-${stamp}.sql`;
  return `im-pos-backup-${stamp}.zip`;
}

// ── SQL dump ────────────────────────────────────────────────────────────────

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "NULL";
    return String(value);
  }
  if (typeof value === "string") {
    // Numeric-as-string (Drizzle numeric) stays quoted so pg casts exactly.
    if (/^-?\d+(\.\d+)?$/.test(value) && value.length < 30) {
      return `'${value.replace(/'/g, "''")}'`;
    }
    return `'${value.replace(/'/g, "''")}'`;
  }
  // jsonb / arrays / objects
  const json = JSON.stringify(value);
  return `'${json.replace(/'/g, "''")}'`;
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export function toSqlDump(backup: BackupFile): string {
  const lines: string[] = [];
  lines.push("-- IM-POS full database backup (logical dump)");
  lines.push(`-- version: ${backup.version}`);
  lines.push(`-- exported_at: ${backup.exportedAt}`);
  lines.push(`-- exported_by: ${backup.exportedBy}`);
  lines.push(`-- checksum_sha256: ${backup.checksumSha256}`);
  lines.push("--");
  lines.push("-- Restore guidance: use the JSON backup via Admin > Backup > Restore,");
  lines.push("-- which validates checksums and writes in FK-safe order inside a transaction.");
  lines.push("-- This SQL file is for manual/audit recovery with psql.");
  lines.push("");

  for (const entry of BACKUP_TABLES) {
    const rows = backup.tables[entry.key] ?? [];
    lines.push(`-- ── ${entry.tableName} (${rows.length} rows) ──`);
    if (rows.length === 0) {
      lines.push(`-- (empty, nothing to insert)`);
      lines.push("");
      continue;
    }
    const columns = Array.from(
      new Set(rows.flatMap((r) => Object.keys(r))),
    ).sort();
    const colList = columns.map(quoteIdent).join(", ");
    for (const row of rows) {
      const values = columns.map((c) => sqlLiteral(row[c] ?? null)).join(", ");
      lines.push(
        `INSERT INTO ${quoteIdent("public")}.${quoteIdent(entry.tableName)} (${colList}) VALUES (${values});`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ── CSV ─────────────────────────────────────────────────────────────────────

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (typeof value === "string") s = value;
  else if (typeof value === "number" || typeof value === "boolean") s = String(value);
  else s = JSON.stringify(value) ?? "";
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(tableKey: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).sort();
  const out: string[] = [columns.map(csvCell).join(",")];
  for (const row of rows) {
    out.push(columns.map((c) => csvCell(row[c] ?? null)).join(","));
  }
  return out.join("\r\n") + "\r\n";
}

export function manifestCsv(backup: BackupFile): string {
  const out: string[] = ["table,rows"];
  for (const entry of BACKUP_TABLES) {
    out.push(`${csvCell(entry.key)},${backup.tables[entry.key]?.length ?? 0}`);
  }
  out.push(`total,${backup.totalRows}`);
  out.push(`version,${backup.version}`);
  out.push(`exported_at,${csvCell(backup.exportedAt)}`);
  out.push(`checksum_sha256,${backup.checksumSha256}`);
  return out.join("\r\n") + "\r\n";
}
