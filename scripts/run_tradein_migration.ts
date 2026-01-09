
import { db } from "../lib/db/client";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  console.log("Reading migration file...");
  const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20260110000000_add_trade_in_logic.sql");
  const migrationSql = fs.readFileSync(migrationPath, "utf8");

  console.log("Applying migration...");
  try {
    await db.execute(sql.raw(migrationSql));
    console.log("Migration applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

runMigration().catch(console.error).then(() => process.exit(0));
