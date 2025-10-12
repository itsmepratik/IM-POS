import { NextRequest, NextResponse } from "next/server";
import { queryClient } from "@/lib/db/client";

export async function POST(request: NextRequest) {
  if (!queryClient) {
    return NextResponse.json(
      { success: false, error: "Database client not initialized" },
      { status: 500 }
    );
  }

  try {
    console.log("🔄 Applying cashier_id migration...");

    // Step 1: Drop the foreign key constraint
    console.log("📝 Dropping foreign key constraint...");
    await queryClient.unsafe(`
      ALTER TABLE "transactions" 
      DROP CONSTRAINT IF EXISTS "transactions_cashier_id_staff_id_fk"
    `);
    console.log("✅ Foreign key constraint dropped");

    // Step 2: Change column type to text
    console.log("📝 Converting cashier_id to text...");
    await queryClient.unsafe(`
      ALTER TABLE "transactions" 
      ALTER COLUMN "cashier_id" TYPE text 
      USING "cashier_id"::text
    `);
    console.log("✅ Column type changed to text");

    // Step 3: Update NULL values
    console.log("📝 Updating NULL values...");
    await queryClient.unsafe(`
      UPDATE "transactions" 
      SET "cashier_id" = 'system' 
      WHERE "cashier_id" IS NULL OR "cashier_id" = ''
    `);
    console.log("✅ NULL values updated");

    console.log("✅ Migration completed successfully!");

    return NextResponse.json({
      success: true,
      message: "Migration applied successfully",
      steps: [
        "Dropped foreign key constraint",
        "Changed cashier_id type to text",
        "Updated NULL values",
      ],
    });
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 }
    );
  }
}
