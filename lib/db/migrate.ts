import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, queryClient } from "./client";

async function main() {
  if (!db || !queryClient) {
    // eslint-disable-next-line no-console
    console.error("DATABASE_URL is not set. Cannot run migrations.");
    process.exit(1);
  }
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    // eslint-disable-next-line no-console
    console.log("Migrations applied successfully");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Migration failed", err);
    process.exit(1);
  } finally {
    await queryClient.end({ timeout: 5 });
  }
}

main();
