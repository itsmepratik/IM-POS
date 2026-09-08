import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDatabase, getQueryClient } from "./lib/db/client";

async function main() {
  const db = getDatabase();
  console.log("Running migrations...");
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migration finished successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    const qc = getQueryClient();
    if (qc) await qc.end({ timeout: 5 });
    process.exit(0);
  }
}

main();
