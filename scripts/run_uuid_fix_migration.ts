
import { db } from "../lib/db/client";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  console.log("Reading fix migration file...");
  const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20260110003000_fix_tradein_uuid.sql");
  const migrationSql = fs.readFileSync(migrationPath, "utf8");

  console.log("Applying fix migration...");
  try {
    await db.execute(sql.raw(migrationSql));
    console.log("Fix migration applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

runMigration().catch(console.error).then(() => process.exit(0));
