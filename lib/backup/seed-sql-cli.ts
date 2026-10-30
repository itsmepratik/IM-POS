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
import { getTableColumns } from "drizzle-orm";
import { getTableConfig, type PgColumn, type PgTable } from "drizzle-orm/pg-core";
import { BACKUP_TABLES, getDrizzleTable, type BackupFile, type BackupTableKey } from "./manifest";
import { verifyChecksum } from "./export";

type Row = Record<string, unknown>;

/** Reviewed and approved drops for backup 2026-10-06 (orphaned staff references). */
const EXPECTED_DROPS: Readonly<Record<string, readonly string[]>> = {
  transactions: [
    "76dc2637-9aee-45e8-8e4d-ec1acd3d3a7e", // A0179 cashier a2b9ab75-… missing
    "dd723a0d-7d08-498d-a6da-34e8d8c3c6a7", // A0180
    "8326747e-7f99-411d-81f5-837c2c58bcd9", // A0181
  ],
  service_items: [
    "728d6104-5ab7-4935-9125-a832617b2c4f",
    "7d8a19ce-d59a-40f6-a2ed-cda680559a3b",
    "819bf129-8079-43a9-acee-ffbbf15b881a",
  ],
  cash_shifts: ["6a15c79f-385b-44a8-9080-7831464e7dbc"], // opener ebda6901-… missing
};

const BATTERY_STATES = new Set(["new", "scrap", "resellable"]);
const INSERT_CHUNK = 200;

interface ColumnMap {
  sqlName: string;
  column: PgColumn;
}

interface TableMeta {
  key: BackupTableKey;
  qualified: string;
  columns: Map<string, ColumnMap>;
  fks: { localKeys: string[]; parentKey: BackupTableKey; parentKeys: string[] }[];
}

function fail(message: string): never {
  throw new Error(message);
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function quoteText(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function log(msg: string, extra: Record<string, unknown> = {}): void {
  process.stderr.write(`${JSON.stringify({ level: "info", msg, ...extra })}\n`);
}

function buildMeta(): Map<BackupTableKey, TableMeta> {
  const byTable = new Map<PgTable, BackupTableKey>();
  for (const entry of BACKUP_TABLES) byTable.set(getDrizzleTable(entry.key) as PgTable, entry.key);

  const meta = new Map<BackupTableKey, TableMeta>();
  for (const entry of BACKUP_TABLES) {
    const table = getDrizzleTable(entry.key) as PgTable;
    const cfg = getTableConfig(table);
    const cols = getTableColumns(table) as Record<string, PgColumn>;
    const columns = new Map<string, ColumnMap>();
    const sqlToProp = new Map<string, string>();
    for (const [prop, column] of Object.entries(cols)) {
      columns.set(prop, { sqlName: column.name, column });
      sqlToProp.set(column.name, prop);
    }
    const fks = cfg.foreignKeys.map((fk) => {
      const ref = fk.reference();
      const parentKey = byTable.get(ref.foreignTable) ?? fail(`FK on ${entry.key} targets a table outside the backup`);
      const parentCols = getTableColumns(ref.foreignTable) as Record<string, PgColumn>;
      const parentProp = (name: string): string =>
        Object.entries(parentCols).find(([, c]) => c.name === name)?.[0] ?? fail(`unknown parent column ${name}`);
      return {
        localKeys: ref.columns.map((c) => sqlToProp.get(c.name) ?? fail(`unknown column ${c.name}`)),
        parentKey,
        parentKeys: ref.foreignColumns.map((c) => parentProp(c.name)),
      };
    });
    meta.set(entry.key, {
      key: entry.key,
      qualified: `${quoteIdent(cfg.schema ?? "public")}.${quoteIdent(cfg.name)}`,
      columns,
      fks,
    });
  }
  return meta;
}

/** Drop rows whose FK targets are absent, iterating to a fixpoint (handles cascades). */
function dropOrphans(tables: Record<string, Row[]>, meta: Map<BackupTableKey, TableMeta>): Record<string, string[]> {
  const dropped: Record<string, string[]> = {};
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of BACKUP_TABLES) {
      const m = meta.get(entry.key) ?? fail(`no meta for ${entry.key}`);
      const rows = tables[entry.key] ?? [];
      const keep: Row[] = [];
      for (const row of rows) {
        const dangling = m.fks.find((fk) => {
          const values = fk.localKeys.map((k) => row[k]);
          if (values.some((v) => v === null || v === undefined)) return false;
          const parents = tables[fk.parentKey] ?? [];
          return !parents.some((p) => fk.parentKeys.every((pk, i) => String(p[pk]) === String(values[i])));
        });
        if (dangling) {
          const id = String(row["id"] ?? JSON.stringify(row));
          (dropped[entry.key] ??= []).push(id);
          log("dropping orphan row", { table: entry.key, id, fk: dangling.localKeys.join(","), parent: dangling.parentKey });
          changed = true;
        } else {
          keep.push(row);
        }
      }
      tables[entry.key] = keep;
    }
  }
  return dropped;
}

function assertExpectedDrops(dropped: Record<string, string[]>): void {
  const keys = new Set([...Object.keys(dropped), ...Object.keys(EXPECTED_DROPS)]);
  for (const key of keys) {
    const got = [...(dropped[key] ?? [])].sort();
    const want = [...(EXPECTED_DROPS[key] ?? [])].sort();
    if (got.length !== want.length || got.some((v, i) => v !== want[i])) {
      fail(`Unexpected orphan drop set for "${key}": got [${got.join(", ")}], expected [${want.join(", ")}]. Review the backup before seeding.`);
    }
  }
}

function normalizeBatteryState(products: Row[]): number {
  let changes = 0;
  for (const row of products) {
    const raw = row["batteryState"];
    if (raw === null || raw === undefined) continue;
    if (typeof raw !== "string") fail(`non-string batteryState on product ${String(row["id"])}`);
    const tokens = raw.split(/\s+/).filter(Boolean);
    // A token list like ["new","resellable"] came from a corrupted edit; the specific state wins.
    const normalized = tokens.includes("resellable") ? "resellable" : tokens.includes("scrap") ? "scrap" : tokens[0];
    if (!normalized || !BATTERY_STATES.has(normalized)) {
      fail(`Unmappable batteryState ${JSON.stringify(raw)} on product ${String(row["id"])}`);
    }
    if (normalized !== raw) {
      log("normalizing batteryState", { id: row["id"], from: raw, to: normalized });
      row["batteryState"] = normalized;
      changes += 1;
    }
  }
  return changes;
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
