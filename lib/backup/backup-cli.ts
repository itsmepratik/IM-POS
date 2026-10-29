/**
 * Offline full-system backup (operator-run, never deployed).
 *
 * Usage:
 *   bun run db:backup
 *   bun run lib/backup/backup-cli.ts [outDir]
 *
 * Writes:
 *   <outDir>/im-pos-backup-<stamp>.json   (restorable via Admin > Backup)
 *   <outDir>/im-pos-backup-<stamp>.sql    (psql / audit recovery)
 *   <outDir>/im-pos-backup-<stamp>.sha256 (checksum sidecar)
 *
 * Reads DATABASE_URL from .env.local / .env. Never prints secrets.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import {
  backupFilename,
  buildBackupFile,
  collectAllTables,
  toSqlDump,
} from "./export";

async function main(): Promise<void> {
  const outDir = process.argv[2] ?? join(process.cwd(), "backups");
  await mkdir(outDir, { recursive: true });

  const collected = await collectAllTables();
  const backup = buildBackupFile(collected, "cli:db:backup");

  const now = new Date();
  const jsonName = backupFilename("json", now);
  const sqlName = backupFilename("sql", now);

  await writeFile(join(outDir, jsonName), JSON.stringify(backup));
  await writeFile(join(outDir, sqlName), toSqlDump(backup));
  await writeFile(
    join(outDir, `${jsonName}.sha256`),
    `${backup.checksumSha256}  ${jsonName}\n`,
  );

  console.error(
    JSON.stringify({
      level: "info",
      msg: "backup complete",
      json: jsonName,
      sql: sqlName,
      rows: backup.totalRows,
      checksum: backup.checksumSha256,
      outDir,
    }),
  );
}

main().then(() => process.exit(0)).catch((err: unknown) => {
  console.error(
    JSON.stringify({
      level: "error",
      msg: "backup failed",
      error: err instanceof Error ? err.message : "unknown",
    }),
  );
  process.exit(1);
});
