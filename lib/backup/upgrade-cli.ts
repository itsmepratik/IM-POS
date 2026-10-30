/**
 * Offline legacy-backup upgrader (operator-run, never deployed). Connects to nothing.
 *
 * Usage:
 *   bun run lib/backup/upgrade-cli.ts <legacy-backup.json> <production-data-dump.sql> <out.json>
 *
 * Produces a NEW backup file (the input is never modified) that passes every
 * restore blocker in lib/backup/restore.ts:
 *   1. Columns the legacy backup never captured are filled from the named
 *      production COPY dump, matched by primary key. Rows absent from the dump
 *      get NULL (the same value the live database holds for them).
 *   2. FK-orphan rows are dropped; the drop set must equal EXPECTED_DROPS.
 *   3. products.battery_state corruption is normalized.
 * The file is re-checksummed with the canonical algorithm, keeps the original
 * exportedAt, and records provenance in exportedBy. The result is re-validated
 * with planRestore() and generation aborts unless it has zero blockers.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { BACKUP_TABLES, type BackupFile } from "./manifest";
import { computeChecksum, verifyChecksum } from "./export";
import { planRestore } from "./restore";
import { assertExpectedDrops, buildMeta, dropOrphans, fail, log, normalizeBatteryState, readCopyBlock, type Row } from "./legacy";

/** Timestamps the restore may legitimately set to "now"; never filled from old dumps. */
const RESTORE_TIME_COLUMNS = new Set(["created_at", "updated_at"]);

function coerce(value: string | null, dataType: string): unknown {
  if (value === null) return null;
  switch (dataType) {
    case "number":
      return Number(value);
    case "boolean":
      return value === "t" || value === "true";
    case "json":
      return JSON.parse(value) as unknown;
    case "date":
      return new Date(value).toISOString();
    default:
      return value; // text, uuid, numeric (Drizzle numeric is a string)
  }
}

function main(): void {
  const [inPath, dumpPath, outPath] = process.argv.slice(2);
  if (!inPath || !dumpPath || !outPath) {
    fail("Usage: bun run lib/backup/upgrade-cli.ts <legacy-backup.json> <production-data-dump.sql> <out.json>");
  }
  if (resolve(inPath).toLowerCase() === resolve(outPath).toLowerCase()) fail("Refusing to overwrite the original backup file.");

  const legacy = JSON.parse(readFileSync(inPath, "utf8")) as BackupFile;
  if (legacy.kind !== "im-pos-full-backup") fail("Not an IM-POS full backup file.");
  if (!verifyChecksum(legacy)) fail("Checksum mismatch on the legacy file — refusing to upgrade a corrupted/edited backup.");

  const meta = buildMeta();
  const tables: Record<string, Row[]> = {};
  for (const e of BACKUP_TABLES) tables[e.key] = (legacy.tables[e.key] ?? []).map((r) => ({ ...r }));

  // 1) Fill columns the legacy export never captured.
  const fills: Record<string, Record<string, { filled: number; nullNoSource: number }>> = {};
  for (const e of BACKUP_TABLES) {
    const rows = tables[e.key];
    if (rows.length === 0) continue;
    const m = meta.get(e.key) ?? fail(`meta ${e.key}`);
    const present = new Set(rows.flatMap((r) => Object.keys(r)));
    const missing = [...m.columns].filter(
      ([prop, c]) => !present.has(prop) && !c.column.generated && !c.column.generatedIdentity && !RESTORE_TIME_COLUMNS.has(c.sqlName),
    );
    if (missing.length === 0) continue;

    const source = new Map(readCopyBlock(dumpPath, m.sqlName).map((r) => [String(r.id), r]));
    for (const [prop, c] of missing) {
      const stat = { filled: 0, nullNoSource: 0 };
      for (const row of rows) {
        const src = source.get(String(row.id));
        if (!src) {
          row[prop] = null;
          stat.nullNoSource++;
          continue;
        }
        if (!(c.sqlName in src)) fail(`Dump has no column ${c.sqlName} for ${e.key}`);
        row[prop] = coerce(src[c.sqlName], c.column.dataType);
        if (row[prop] !== null) stat.filled++;
      }
      (fills[e.key] ??= {})[c.sqlName] = stat;
    }
  }

  // FK values introduced by fills must point at rows that exist in this backup.
  const typeIds = new Set(tables.types.map((t) => String(t.id)));
  for (const p of tables.products) {
    if (p.typeId != null && !typeIds.has(String(p.typeId))) fail(`products.type_id ${String(p.typeId)} not present in types`);
  }

  // 2) Orphans (approved set only)  3) battery_state
  const dropped = dropOrphans(tables, meta);
  assertExpectedDrops(dropped);
  const batteryFixes = normalizeBatteryState(tables.products ?? []);

  const rowCounts: Record<string, number> = {};
  for (const e of BACKUP_TABLES) rowCounts[e.key] = tables[e.key].length;
  const totalRows = Object.values(rowCounts).reduce((n, c) => n + c, 0);

  const upgraded: BackupFile = {
    kind: "im-pos-full-backup",
    version: legacy.version,
    exportedAt: legacy.exportedAt,
    exportedBy: `${legacy.exportedBy} [upgraded by cli:backup-upgrade; source sha256 ${legacy.checksumSha256.slice(0, 16)}…]`,
    rowCounts,
    totalRows,
    checksumSha256: computeChecksum(tables, rowCounts, totalRows),
    tables,
  };

  const plan = planRestore(upgraded);
  if (!plan.checksumValid || plan.blockers.length > 0) {
    fail(`Upgraded file still has blockers: ${plan.blockers.join(" | ")}`);
  }

  writeFileSync(outPath, JSON.stringify(upgraded));
  log("upgraded backup written", {
    out: outPath,
    rows: totalRows,
    checksum: upgraded.checksumSha256,
    fills,
    dropped: Object.fromEntries(Object.entries(dropped).map(([k, v]) => [k, v.length])),
    batteryFixes,
    blockers: plan.blockers.length,
  });
}

try {
  main();
} catch (err: unknown) {
  process.stderr.write(`${JSON.stringify({ level: "error", msg: "backup upgrade failed", error: err instanceof Error ? err.message : "unknown" })}\n`);
  process.exit(1);
}
