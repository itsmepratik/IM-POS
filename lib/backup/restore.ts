/**
 * Server-only restore planning + execution.
 * NEVER import from a Client Component.
 */

import { getDatabase } from "@/lib/db/client";
import {
  BACKUP_TABLES,
  RESTORE_DELETE_ORDER,
  getDrizzleTable,
  type BackupFile,
  type BackupTableKey,
} from "./manifest";
import { verifyChecksum } from "./export";

/** Columns that Postgres generates — must be stripped before INSERT. */
const GENERATED_COLUMNS: Record<string, string[]> = {
  inventory: ["totalStock", "total_stock"],
};

export interface RestorePlan {
  checksumValid: boolean;
  perTable: { key: string; tableName: string; rows: number }[];
  totalRows: number;
  warnings: string[];
}

function stripGenerated(key: string, row: Record<string, unknown>): Record<string, unknown> {
  const banned = GENERATED_COLUMNS[key];
  if (!banned || banned.length === 0) return row;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (!banned.includes(k)) out[k] = v;
  }
  return out;
}

export function planRestore(backup: BackupFile): RestorePlan {
  const checksumValid = verifyChecksum(backup);
  const perTable = BACKUP_TABLES.map((entry) => ({
    key: entry.key,
    tableName: entry.tableName,
    rows: backup.tables[entry.key]?.length ?? 0,
  }));
  const totalRows = perTable.reduce((n, t) => n + t.rows, 0);
  const warnings: string[] = [];

  if (!checksumValid) {
    warnings.push("Checksum mismatch — file may be corrupted or edited. Refusing restore.");
  }

  // Duplicate primary-key check for rows carrying an `id`.
  for (const entry of BACKUP_TABLES) {
    const rows = backup.tables[entry.key] ?? [];
    const seen = new Set<string>();
    let checked = 0;
    for (const row of rows) {
      const id = row["id"];
      if (typeof id === "string" && id.length > 0) {
        checked += 1;
        if (seen.has(id)) {
          warnings.push(`Duplicate id "${id}" in table "${entry.key}".`);
          break;
        }
        seen.add(id);
      }
    }
    if (checked === 0 && rows.length > 0 && entry.key !== "reference_number_counters") {
      warnings.push(`Table "${entry.key}" rows carry no "id" — cannot verify key uniqueness.`);
    }
  }

  // Declared counts vs actual payload.
  for (const entry of BACKUP_TABLES) {
    const declared = backup.rowCounts[entry.key];
    const actual = backup.tables[entry.key]?.length ?? 0;
    if (declared !== undefined && declared !== actual) {
      warnings.push(
        `Row-count mismatch for "${entry.key}": manifest says ${declared}, file has ${actual}.`,
      );
    }
  }
  if (backup.totalRows !== totalRows) {
    warnings.push(
      `Total mismatch: manifest says ${backup.totalRows}, file has ${totalRows}.`,
    );
  }

  warnings.push(
    "Restore is destructive: it deletes current data (children-first) and re-inserts the backup (parents-first) inside one transaction.",
  );
  warnings.push("Download a fresh backup BEFORE restoring, and restore only during a maintenance window.");

  return { checksumValid, perTable, totalRows, warnings };
}

const INSERT_CHUNK_SIZE = 500;

/** Execute a full restore inside a single transaction. Returns per-table inserted counts. */
export async function executeRestore(backup: BackupFile): Promise<Record<string, number>> {
  const db = getDatabase();
  if (!db) {
    throw new Error("Database client not initialized — check DATABASE_URL.");
  }
  const inserted: Record<string, number> = {};

  await db.transaction(async (tx) => {
    // 1) Destructive deletes, children-first.
    for (const entry of RESTORE_DELETE_ORDER) {
      const table = getDrizzleTable(entry.key as BackupTableKey);
      await tx.delete(table as never);
    }
    // 2) Re-inserts, parents-first, chunked.
    for (const entry of BACKUP_TABLES) {
      const rows = (backup.tables[entry.key] ?? []).map((r) =>
        stripGenerated(entry.key, r as Record<string, unknown>),
      );
      if (rows.length === 0) {
        inserted[entry.key] = 0;
        continue;
      }
      const table = getDrizzleTable(entry.key as BackupTableKey);
      for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
        const chunk = rows.slice(i, i + INSERT_CHUNK_SIZE);
        await tx.insert(table as never).values(chunk as never);
      }
      inserted[entry.key] = rows.length;
    }
  });

  return inserted;
}
