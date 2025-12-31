import { queryClient } from "../lib/db/client";

async function run() {
  try {
    console.log("Adding pos_id column to shops table...");
    await queryClient`ALTER TABLE shops ADD COLUMN IF NOT EXISTS pos_id TEXT`;
    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    // Force exit after a short delay to allow logs to flush
    setTimeout(() => process.exit(0), 1000);
  }
}

run();
