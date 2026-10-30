/**
 * Shared, offline-only helpers for bringing LEGACY backups up to the current schema.
 * Used by seed-sql-cli.ts and upgrade-cli.ts. Never imported by the app runtime.
 *
 * Every transformation is explicit and asserted:
 *   - orphan drops must match an approved list exactly
 *   - battery_state normalization only maps known corrupt values
 *   - column fills come from a named production dump and are counted
 */
import { readFileSync } from "node:fs";
import { getTableColumns } from "drizzle-orm";
import { getTableConfig, type PgColumn, type PgTable } from "drizzle-orm/pg-core";
import { BACKUP_TABLES, getDrizzleTable, type BackupTableKey } from "./manifest";

export type Row = Record<string, unknown>;

/** Reviewed and approved drops for backup 2026-10-06 (orphaned staff references). */
export const EXPECTED_DROPS: Readonly<Record<string, readonly string[]>> = {
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

export function log(msg: string, extra: Record<string, unknown> = {}): void {
  process.stderr.write(`${JSON.stringify({ level: "info", msg, ...extra })}\n`);
}

export function fail(message: string): never {
  throw new Error(message);
}

export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export interface LegacyTableMeta {
  key: BackupTableKey;
  /** Unquoted SQL table name (e.g. "products"). */
  sqlName: string;
  /** Quoted, schema-qualified name (e.g. "public"."products"). */
  qualified: string;
  /** JS property -> { sqlName, column } */
  columns: Map<string, { sqlName: string; column: PgColumn }>;
  fks: { localKeys: string[]; parentKey: BackupTableKey; parentKeys: string[] }[];
}

export function buildMeta(): Map<BackupTableKey, LegacyTableMeta> {
  const byTable = new Map<PgTable, BackupTableKey>();
  for (const entry of BACKUP_TABLES) byTable.set(getDrizzleTable(entry.key) as PgTable, entry.key);

  const meta = new Map<BackupTableKey, LegacyTableMeta>();
  for (const entry of BACKUP_TABLES) {
    const table = getDrizzleTable(entry.key) as PgTable;
    const cfg = getTableConfig(table);
    const cols = getTableColumns(table) as Record<string, PgColumn>;
    const columns = new Map<string, { sqlName: string; column: PgColumn }>();
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
      sqlName: cfg.name,
      qualified: `${quoteIdent(cfg.schema ?? "public")}.${quoteIdent(cfg.name)}`,
      columns,
      fks,
    });
  }
  return meta;
}

/** Drop rows whose FK targets are absent, iterating to a fixpoint (handles cascades). */
export function dropOrphans(
  tables: Record<string, Row[]>,
  meta: Map<BackupTableKey, LegacyTableMeta>,
): Record<string, string[]> {
  const dropped: Record<string, string[]> = {};
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of BACKUP_TABLES) {
      const m = meta.get(entry.key) ?? fail(`no meta for ${entry.key}`);
      const keep: Row[] = [];
      for (const row of tables[entry.key] ?? []) {
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

export function assertExpectedDrops(dropped: Record<string, string[]>): void {
  const keys = new Set([...Object.keys(dropped), ...Object.keys(EXPECTED_DROPS)]);
  for (const key of keys) {
    const got = [...(dropped[key] ?? [])].sort();
    const want = [...(EXPECTED_DROPS[key] ?? [])].sort();
    if (got.length !== want.length || got.some((v, i) => v !== want[i])) {
      fail(`Unexpected orphan drop set for "${key}": got [${got.join(", ")}], expected [${want.join(", ")}]. Review the backup before seeding.`);
    }
  }
}

export function normalizeBatteryState(products: Row[]): number {
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

/** Parse one table's COPY block from a pg-style data dump into rows keyed by SQL column name. */
export function readCopyBlock(dumpPath: string, tableName: string): Record<string, string | null>[] {
  const lines = readFileSync(dumpPath, "utf8").split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`COPY public."${tableName}"`));
  if (start < 0) fail(`COPY block for ${tableName} not found in ${dumpPath}`);
  const cols = lines[start].match(/\(([^)]*)\)/)?.[1].split(",").map((c) => c.trim().replace(/"/g, "")) ?? [];
  const unescape = (v: string): string | null =>
    v === "\\N" ? null : v.replace(/\\t/g, "\t").replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\\\/g, "\\");
  const rows: Record<string, string | null>[] = [];
  for (let i = start + 1; i < lines.length && lines[i] !== "\\."; i++) {
    if (!lines[i]) continue;
    const f = lines[i].split("\t");
    if (f.length !== cols.length) fail(`${tableName}: bad column count at dump line ${i + 1}`);
    rows.push(Object.fromEntries(cols.map((c, j) => [c, unescape(f[j])])));
  }
  return rows;
}
