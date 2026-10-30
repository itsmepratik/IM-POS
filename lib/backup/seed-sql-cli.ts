/**
 * Offline seed-script generator (operator-run, never deployed).
 *
 * Converts a verified JSON backup into ONE transactional psql script that loads
 * an EMPTY, already-migrated database. It does not connect to any database.
 *
 * Usage:
 *   bun run lib/backup/seed-sql-cli.ts <backup.json> <out.sql>
 *
 * Guarantees of the generated script:
 *   - Runs inside a single transaction with ON_ERROR_STOP: all-or-nothing.
 *   - Refuses to run if any target table is missing or already has rows
 *     (never deletes or overwrites existing data).
 *   - Column names come from the Drizzle schema (snake_case), never from JSON keys.
 *   - Generated columns (inventory.total_stock) are skipped.
 *   - USER triggers are disabled during load so stock-sync / batch-number /
 *     stock-alert triggers cannot rewrite the backup. FK constraint triggers stay
 *     active, so Postgres still enforces referential integrity.
 *   - Row counts are re-verified in-transaction before COMMIT.
 *
 * Data transformations (explicit, logged, and asserted):
 *   - Rows with dangling FKs (and their dependents) are dropped. The drop set must
 *     exactly match EXPECTED_DROPS or generation aborts.
 *   - products.battery_state is normalized to 'new' | 'scrap' | 'resellable'.
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { PgColumn } from "drizzle-orm/pg-core";
import { BACKUP_TABLES, type BackupFile } from "./manifest";
import { verifyChecksum } from "./export";
import {
  assertExpectedDrops,
  buildMeta,
  dropOrphans,
  fail,
  log,
  normalizeBatteryState,
  quoteIdent,
  type Row,
} from "./legacy";

const INSERT_CHUNK = 200;

function quoteText(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function literal(value: unknown, column: PgColumn): string {
  if (value === null || value === undefined) return "NULL";
  switch (column.dataType) {
    case "json":
      return `${quoteText(JSON.stringify(value))}::jsonb`;
    case "boolean":
      if (typeof value !== "boolean") fail(`expected boolean for ${column.name}, got ${typeof value}`);
      return value ? "TRUE" : "FALSE";
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) fail(`expected finite number for ${column.name}`);
      return String(value);
    default:
      if (typeof value === "object") fail(`unexpected object for non-json column ${column.name}`);
      return quoteText(String(value));
  }
}

function main(): void {
  const [inPath, outPath] = process.argv.slice(2);
  if (!inPath || !outPath) fail("Usage: bun run lib/backup/seed-sql-cli.ts <backup.json> <out.sql>");

  const backup = JSON.parse(readFileSync(inPath, "utf8")) as BackupFile;
  if (backup.kind !== "im-pos-full-backup") fail("Not an IM-POS full backup file.");
  if (!verifyChecksum(backup)) fail("Checksum mismatch — refusing to generate a seed from a corrupted/edited file.");

  const meta = buildMeta();
  const tables: Record<string, Row[]> = {};
  for (const entry of BACKUP_TABLES) tables[entry.key] = (backup.tables[entry.key] ?? []).map((r) => ({ ...r }));

  const dropped = dropOrphans(tables, meta);
  assertExpectedDrops(dropped);
  const batteryFixes = normalizeBatteryState(tables["products"] ?? []);

  const out: string[] = [];
  out.push("-- IM-POS seed generated from verified backup");
  out.push(`-- source_exported_at: ${backup.exportedAt}`);
  out.push(`-- source_checksum_sha256: ${backup.checksumSha256}`);
  out.push(`-- dropped_orphans: ${JSON.stringify(dropped)}`);
  out.push(`-- battery_state_normalized: ${batteryFixes}`);
  out.push("\\set ON_ERROR_STOP on");
  out.push("BEGIN;");
  out.push("SET LOCAL lock_timeout = '10s';");
  out.push("SET LOCAL statement_timeout = 0;");
  out.push("");

  // Guard: every table exists and is empty. Never overwrite live data.
  out.push("DO $guard$");
  out.push("DECLARE n bigint;");
  out.push("BEGIN");
  for (const entry of BACKUP_TABLES) {
    const m = meta.get(entry.key) ?? fail("meta");
    out.push(`  IF to_regclass(${quoteText(m.qualified)}) IS NULL THEN RAISE EXCEPTION 'Missing table % — run migrations first', ${quoteText(m.qualified)}; END IF;`);
    out.push(`  EXECUTE 'SELECT count(*) FROM ${m.qualified.replace(/'/g, "''")}' INTO n;`);
    out.push(`  IF n > 0 THEN RAISE EXCEPTION 'Refusing to seed: % already has % rows', ${quoteText(m.qualified)}, n; END IF;`);
  }
  out.push("END");
  out.push("$guard$;");
  out.push("");

  for (const entry of BACKUP_TABLES) {
    const m = meta.get(entry.key) ?? fail("meta");
    out.push(`ALTER TABLE ${m.qualified} DISABLE TRIGGER USER;`);
  }
  out.push("");

  const expectedCounts: [string, number][] = [];
  for (const entry of BACKUP_TABLES) {
    const m = meta.get(entry.key) ?? fail("meta");
    const rows = tables[entry.key] ?? [];
    expectedCounts.push([m.qualified, rows.length]);
    out.push(`-- ${entry.key}: ${rows.length} rows`);
    if (rows.length === 0) continue;

    const props = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
    for (const p of props) {
      if (!m.columns.has(p)) fail(`Backup key "${entry.key}.${p}" has no matching schema column — schema drift.`);
    }
    const insertable = props.filter((p) => {
      const c = m.columns.get(p) ?? fail("col");
      return !c.column.generated && !c.column.generatedIdentity;
    });
    const colList = insertable.map((p) => quoteIdent((m.columns.get(p) ?? fail("col")).sqlName)).join(", ");

    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      const chunk = rows.slice(i, i + INSERT_CHUNK);
      const values = chunk
        .map((row) => `(${insertable.map((p) => literal(row[p], (m.columns.get(p) ?? fail("col")).column)).join(", ")})`)
        .join(",\n  ");
      out.push(`INSERT INTO ${m.qualified} (${colList}) VALUES\n  ${values};`);
    }
    out.push("");
  }

  for (const entry of BACKUP_TABLES) {
    const m = meta.get(entry.key) ?? fail("meta");
    out.push(`ALTER TABLE ${m.qualified} ENABLE TRIGGER USER;`);
  }
  out.push("");

  out.push("DO $verify$");
  out.push("DECLARE n bigint;");
  out.push("BEGIN");
  for (const [qualified, count] of expectedCounts) {
    out.push(`  EXECUTE 'SELECT count(*) FROM ${qualified.replace(/'/g, "''")}' INTO n;`);
    out.push(`  IF n <> ${count} THEN RAISE EXCEPTION 'Verify failed: % has % rows, expected ${count}', ${quoteText(qualified)}, n; END IF;`);
  }
  out.push("END");
  out.push("$verify$;");
  out.push("");
  out.push("COMMIT;");
  out.push("");

  writeFileSync(outPath, out.join("\n"), "utf8");
  log("seed script written", {
    out: outPath,
    rows: expectedCounts.reduce((n, [, c]) => n + c, 0),
    dropped: Object.fromEntries(Object.entries(dropped).map(([k, v]) => [k, v.length])),
    batteryFixes,
  });
}

try {
  main();
} catch (err: unknown) {
  process.stderr.write(`${JSON.stringify({ level: "error", msg: "seed generation failed", error: err instanceof Error ? err.message : "unknown" })}\n`);
  process.exit(1);
}
