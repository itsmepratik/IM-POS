/**
 * Script to apply the cashier_id migration
 * Run with: bun run scripts/apply-migration.ts
 */

import { queryClient } from "../lib/db/client";
import { readFileSync } from "fs";
import { join } from "path";

async function applyMigration() {
  if (!queryClient) {
    console.error("❌ Database client not initialized");
    process.exit(1);
  }

  try {
    console.log("🔄 Reading migration file...");
    const migrationPath = join(
      process.cwd(),
      "supabase",
      "migrations",
      "20250118000000_revert_cashier_id_to_text.sql"
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("🔄 Applying migration...");
    console.log("SQL:", migrationSQL);

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter(
        (s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("COMMENT")
      );

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`\n📝 Executing: ${statement.substring(0, 100)}...`);
        await queryClient.unsafe(statement);
        console.log("✅ Statement executed successfully");
      }
    }

    console.log("\n✅ Migration applied successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration();
