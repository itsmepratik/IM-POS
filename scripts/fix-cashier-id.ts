import { queryClient } from "../lib/db/client";

async function fixCashierId() {
  if (!queryClient) {
    console.error("❌ Database client not initialized");
    process.exit(1);
  }

  try {
    console.log("🔄 Fixing cashier_id column type...");

    // Step 1: Drop the foreign key constraint if it exists
    console.log("📝 Step 1: Dropping foreign key constraint...");
    try {
      await queryClient.unsafe(`
        ALTER TABLE "transactions"
        DROP CONSTRAINT IF EXISTS "transactions_cashier_id_staff_id_fk"
      `);
      console.log("✅ Foreign key constraint dropped");
    } catch (error) {
      console.log("ℹ️ Foreign key constraint may not exist, continuing...");
    }

    // Step 2: Change cashier_id type to text
    console.log("📝 Step 2: Changing cashier_id type to text...");
    await queryClient.unsafe(`
      ALTER TABLE "transactions"
      ALTER COLUMN "cashier_id" TYPE text
    `);
    console.log("✅ Column type changed to text");

    // Step 3: Update any NULL values
    console.log("📝 Step 3: Updating NULL values...");
    await queryClient.unsafe(`
      UPDATE "transactions"
      SET "cashier_id" = 'system'
      WHERE "cashier_id" IS NULL OR "cashier_id" = ''
    `);
    console.log("✅ NULL values updated");

    // Step 4: Test the fix
    console.log("📝 Step 4: Testing the fix...");
    const testResult = await queryClient.unsafe(`
      SELECT "cashier_id" FROM "transactions" LIMIT 1
    `);
    console.log(
      "✅ Test query successful. Sample cashier_id:",
      testResult[0]?.cashier_id
    );

    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

fixCashierId();
