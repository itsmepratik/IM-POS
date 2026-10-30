/**
 * Server-only restore planning + execution.
 * NEVER import from a Client Component.
 */

import { getTableColumns, sql } from "drizzle-orm";
import { getTableConfig, type PgColumn, type PgTable } from "drizzle-orm/pg-core";
import { getDatabase } from "@/lib/db/client";
import {
  BACKUP_TABLES,
  RESTORE_DELETE_ORDER,
  getDrizzleTable,
  type BackupFile,
  type BackupTableKey,
} from "./manifest";
import { verifyChecksum } from "./export";

type Row = Record<string, unknown>;

export interface RestorePlan {
  checksumValid: boolean;
  perTable: { key: string; tableName: string; rows: number }[];
  totalRows: number;
  /** Informational notes shown to the operator. */
  warnings: string[];
  /** Hard failures. A restore is refused while this is non-empty. */
  blockers: string[];
}

interface TableMeta {
  table: PgTable;
  name: string;
  /** JS property -> column */
  columns: Map<string, PgColumn>;
  fks: { localProps: string[]; parentKey: BackupTableKey; parentProps: string[] }[];
}

/** Built lazily so importing this module never touches the DB or env. */
let metaCache: Map<BackupTableKey, TableMeta> | undefined;

function getMeta(): Map<BackupTableKey, TableMeta> {
  if (metaCache) return metaCache;
  const byTable = new Map<PgTable, BackupTableKey>();
  for (const e of BACKUP_TABLES) byTable.set(getDrizzleTable(e.key) as PgTable, e.key);

  const meta = new Map<BackupTableKey, TableMeta>();
  for (const e of BACKUP_TABLES) {
    const table = getDrizzleTable(e.key) as PgTable;
    const cfg = getTableConfig(table);
    const columns = new Map(Object.entries(getTableColumns(table) as Record<string, PgColumn>));
    const propOf = (cols: Map<string, PgColumn>, sqlName: string): string => {
      for (const [prop, col] of cols) if (col.name === sqlName) return prop;
      throw new Error(`Schema metadata error: column ${sqlName} not found`);
    };
    const fks = cfg.foreignKeys.flatMap((fk) => {
      const ref = fk.reference();
      const parentKey = byTable.get(ref.foreignTable);
      if (!parentKey) return []; // FK to a table outside the backup (none today)
      const parentCols = new Map(Object.entries(getTableColumns(ref.foreignTable) as Record<string, PgColumn>));
      return [{
        localProps: ref.columns.map((c) => propOf(columns, c.name)),
        parentKey,
        parentProps: ref.foreignColumns.map((c) => propOf(parentCols, c.name)),
      }];
    });
    meta.set(e.key, { table, name: cfg.name, columns, fks });
  }
  metaCache = meta;
  return meta;
}

function isInsertable(col: PgColumn): boolean {
  return !col.generated && !col.generatedIdentity;
}

export function planRestore(backup: BackupFile): RestorePlan {
  const meta = getMeta();
  const checksumValid = verifyChecksum(backup);
  const warnings: string[] = [];
  const blockers: string[] = [];

  const perTable = BACKUP_TABLES.map((entry) => ({
    key: entry.key,
    tableName: entry.tableName,
    rows: backup.tables[entry.key]?.length ?? 0,
  }));
  const totalRows = perTable.reduce((n, t) => n + t.rows, 0);

  if (!checksumValid) {
    blockers.push("Checksum mismatch — file may be corrupted or edited.");
  }

  for (const entry of BACKUP_TABLES) {
    const declared = backup.rowCounts[entry.key];
    const actual = backup.tables[entry.key]?.length ?? 0;
    if (declared !== undefined && declared !== actual) {
      blockers.push(`Row-count mismatch for "${entry.key}": manifest says ${declared}, file has ${actual}.`);
    }
  }
  if (backup.totalRows !== totalRows) {
    blockers.push(`Total mismatch: manifest says ${backup.totalRows}, file has ${totalRows}.`);
  }

  for (const entry of BACKUP_TABLES) {
    const m = meta.get(entry.key);
    if (!m) continue;
    const rows = backup.tables[entry.key] ?? [];
    if (rows.length === 0) continue;

    // Duplicate primary keys
    const seen = new Set<string>();
    for (const row of rows) {
      const id = row["id"];
      if (typeof id === "string") {
        if (seen.has(id)) {
          blockers.push(`Duplicate id "${id}" in "${entry.key}".`);
          break;
        }
        seen.add(id);
      }
    }

    // Schema drift: keys the current schema does not know
    const keys = new Set(rows.flatMap((r) => Object.keys(r)));
    const unknown = [...keys].filter((k) => !m.columns.has(k));
    if (unknown.length > 0) {
      blockers.push(`"${entry.key}" has columns the current schema does not define: ${unknown.join(", ")}.`);
    }

    // Lossy restore: current columns the backup never captured
    const missing = [...m.columns]
      .filter(([prop, col]) => isInsertable(col) && !keys.has(prop))
      .map(([, col]) => col.name);
    const harmless = new Set(["created_at", "updated_at"]);
    const lossy = missing.filter((c) => !harmless.has(c));
    if (lossy.length > 0) {
      blockers.push(
        `"${entry.key}" backup predates columns [${lossy.join(", ")}]. Restoring would erase their current values. ` +
          "Take a fresh backup, or restore this file with the offline seed tool.",
      );
    }
    const resetTimestamps = missing.filter((c) => harmless.has(c));
    if (resetTimestamps.length > 0) {
      warnings.push(`"${entry.key}": ${resetTimestamps.join(", ")} not in backup — will be set to the restore time.`);
    }
  }

  // Referential integrity inside the file (exactly what Postgres will enforce)
  for (const entry of BACKUP_TABLES) {
    const m = meta.get(entry.key);
    if (!m) continue;
    for (const fk of m.fks) {
      const parents = new Set(
        (backup.tables[fk.parentKey] ?? []).map((p) => fk.parentProps.map((pp) => String(p[pp])).join("|")),
      );
      const orphans = (backup.tables[entry.key] ?? []).filter((r) => {
        const vals = fk.localProps.map((lp) => r[lp]);
        if (vals.some((v) => v === null || v === undefined)) return false;
        return !parents.has(vals.map(String).join("|"));
      });
      if (orphans.length > 0) {
        const sample = orphans.slice(0, 5).map((r) => String(r["referenceNumber"] ?? r["id"])).join(", ");
        blockers.push(
          `${orphans.length} "${entry.key}" row(s) reference missing "${fk.parentKey}" via ${fk.localProps.join(",")} (e.g. ${sample}).`,
        );
      }
    }
  }

  warnings.push(
    "Restore is destructive: it deletes current data (children-first) and re-inserts the backup (parents-first) inside one transaction.",
  );
  warnings.push("Download a fresh backup BEFORE restoring, and restore only during a maintenance window.");

  return { checksumValid, perTable, totalRows, warnings, blockers };
}

/** Convert JSON-safe backup values back into what Drizzle column mappers expect. */
function reviveRow(key: BackupTableKey, row: Row, columns: Map<string, PgColumn>): Row {
  const out: Row = {};
  for (const [prop, value] of Object.entries(row)) {
    const col = columns.get(prop);
    if (!col) throw new Error(`Unknown column "${key}.${prop}" (plan should have blocked this).`);
    if (!isInsertable(col)) continue;
    if (col.dataType === "date" && typeof value === "string") {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) throw new Error(`Invalid timestamp in "${key}.${prop}": ${value}`);
      out[prop] = d;
    } else {
      out[prop] = value;
    }
  }
  return out;
}

const INSERT_CHUNK_SIZE = 500;

/**
 * Execute a full restore inside a single transaction. Returns per-table inserted counts.
 * Refuses to run if the plan has blockers.
 */
export async function executeRestore(backup: BackupFile): Promise<Record<string, number>> {
  const plan = planRestore(backup);
  if (plan.blockers.length > 0) {
    throw new Error(`Restore refused: ${plan.blockers.join(" | ")}`);
  }

  const db = getDatabase();
  if (!db) {
    throw new Error("Database client not initialized — check DATABASE_URL.");
  }
  const meta = getMeta();
  const inserted: Record<string, number> = {};

  await db.transaction(async (tx) => {
    // Pause USER triggers only: batch-number / stock-sync / alert triggers would
    // otherwise rewrite restored values. FK constraint triggers stay active.
    for (const entry of BACKUP_TABLES) {
      const m = meta.get(entry.key);
      if (m) await tx.execute(sql`ALTER TABLE ${sql.identifier(m.name)} DISABLE TRIGGER USER`);
    }

    for (const entry of RESTORE_DELETE_ORDER) {
      const m = meta.get(entry.key);
      if (m) await tx.delete(m.table as never);
    }

    for (const entry of BACKUP_TABLES) {
      const m = meta.get(entry.key);
      if (!m) continue;
      const rows = (backup.tables[entry.key] ?? []).map((r) => reviveRow(entry.key, r as Row, m.columns));
      for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
        await tx.insert(m.table as never).values(rows.slice(i, i + INSERT_CHUNK_SIZE) as never);
      }
      inserted[entry.key] = rows.length;
    }

    for (const entry of BACKUP_TABLES) {
      const m = meta.get(entry.key);
      if (m) await tx.execute(sql`ALTER TABLE ${sql.identifier(m.name)} ENABLE TRIGGER USER`);
    }

    // Verify before COMMIT; any mismatch throws and rolls everything back.
    for (const entry of BACKUP_TABLES) {
      const m = meta.get(entry.key);
      if (!m) continue;
      const res = await tx.execute(sql`SELECT count(*)::int AS n FROM ${sql.identifier(m.name)}`);
      const n = Number((res as unknown as { n: number }[])[0]?.n);
      if (n !== (inserted[entry.key] ?? 0)) {
        throw new Error(`Post-restore verification failed for "${entry.key}": ${n} rows, expected ${inserted[entry.key] ?? 0}.`);
      }
    }
  });

  return inserted;
}
