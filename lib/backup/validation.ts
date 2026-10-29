import { z } from "zod";
import { BACKUP_TABLES, BACKUP_VERSION } from "./manifest";

export const MAX_RESTORE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_RESTORE_ROWS = 200_000;

const tableKeys = BACKUP_TABLES.map((t) => t.key);

const TablesSchema = z.record(
  z.string(),
  z.array(z.record(z.string(), z.unknown())),
);

export const BackupFileSchema = z
  .object({
    kind: z.literal("im-pos-full-backup"),
    version: z.number().int().refine((v) => v === BACKUP_VERSION, {
      message: `Unsupported backup version (expected ${BACKUP_VERSION})`,
    }),
    exportedAt: z.string().datetime({ offset: true }),
    exportedBy: z.string().min(1).max(320),
    rowCounts: z.record(z.string(), z.number().int().nonnegative()),
    totalRows: z.number().int().nonnegative(),
    checksumSha256: z.string().regex(/^[0-9a-f]{64}$/i, "Invalid checksum"),
    tables: TablesSchema,
  })
  .superRefine((val, ctx) => {
    for (const key of tableKeys) {
      if (!Array.isArray(val.tables[key])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tables", key],
          message: `Missing table "${key}" — is this a complete full-system backup?`,
        });
      }
    }
    const extra = Object.keys(val.tables).filter(
      (k) => !(tableKeys as string[]).includes(k),
    );
    if (extra.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tables"],
        message: `Unknown tables in backup: ${extra.join(", ")}`,
      });
    }
    if (val.totalRows > MAX_RESTORE_ROWS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalRows"],
        message: `Backup too large (${val.totalRows} rows, max ${MAX_RESTORE_ROWS}). Restore in parts or contact support.`,
      });
    }
  });

export type BackupFileInput = z.infer<typeof BackupFileSchema>;

export const RestoreRequestSchema = z.object({
  backup: BackupFileSchema,
  /** Required literal when dryRun is false — deliberate destructive-action gate. */
  confirm: z.string().optional(),
  dryRun: z.boolean().default(true),
});

export type RestoreRequestInput = z.infer<typeof RestoreRequestSchema>;

export const BackupQuerySchema = z.object({
  format: z.enum(["json", "sql", "csv-zip"]).default("json"),
});

export type BackupQueryInput = z.infer<typeof BackupQuerySchema>;
