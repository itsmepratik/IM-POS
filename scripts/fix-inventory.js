// Fix Inventory Data Script
// Run with: bun run scripts/fix-inventory.js

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with your project credentials
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://putvnnpptgiupfsohggq.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHZubnBwdGdpdXBmc29oZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODUxMzQsImV4cCI6MjA1NDI2MTEzNH0.i4x7TVrZo2gqIInWS-0uBJNxNWlnoItM0YmypbrpIw4";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixOilProducts() {
  console.log("Starting oil product fix...");

  // 1. Get all oil products
  const { data: oilProducts, error: oilProductsError } = await supabase
    .from("items")
    .select("id, name, is_oil")
    .eq("is_oil", true);

  if (oilProductsError) {
    console.error("Error fetching oil products:", oilProductsError);
    return;
  }

  console.log(`Found ${oilProducts.length} oil products`);

  // 2. Fix bottle states for each oil product in all branches
  for (const product of oilProducts) {
    console.log(`Processing oil product: ${product.name} (${product.id})`);

    // Get all branch inventory records for this product
    const { data: branchInventory, error: branchError } = await supabase
      .from("location_stock")
      .select("*")
      .eq("item_id", product.id)
      .is("batch_id", null);

    if (branchError) {
      console.error(
        `Error fetching branch inventory for product ${product.id}:`,
        branchError
      );
      continue;
    }

    console.log(`Found ${branchInventory.length} branch inventory records`);

    // Check and fix each branch inventory record
    for (const record of branchInventory) {
      console.log(
        `Branch ${record.branch_id}: quantity=${record.quantity}, open=${record.open_bottles}, closed=${record.closed_bottles}`
      );

      // If open_bottles or closed_bottles is null, fix it
      if (record.open_bottles === null || record.closed_bottles === null) {
        // Set values based on best guess, for example half of quantity for each
        const totalQuantity = record.quantity || 0;
        const openBottles =
          record.open_bottles ?? Math.floor(totalQuantity / 2);
        const closedBottles =
          record.closed_bottles ?? totalQuantity - openBottles;

        console.log(
          `Fixing record ${record.id}: setting open=${openBottles}, closed=${closedBottles}`
        );

        // Update the record
        const { error: updateError } = await supabase
          .from("location_stock")
          .update({
            open_bottles: openBottles,
            closed_bottles: closedBottles,
            quantity: openBottles + closedBottles,
          })
          .eq("id", record.id);

        if (updateError) {
          console.error(`Error updating record ${record.id}:`, updateError);
        } else {
          console.log(`Successfully updated record ${record.id}`);
        }
      }
    }
  }

  console.log("Oil product fix completed");
}

async function fixDeletedItems() {
  console.log("Starting deleted items fix...");

  // 1. Get all branch IDs
  const { data: branches, error: branchError } = await supabase
    .from("branches")
    .select("id, name");

  if (branchError) {
    console.error("Error fetching branches:", branchError);
    return;
  }

  // 2. For each branch, check for and delete orphaned location_stock records
  for (const branch of branches) {
    console.log(`\nChecking branch: ${branch.name} (${branch.id})`);

    // Find location_stock records that reference non-existent items
    const { data: orphanedRecords, error: orphanError } = await supabase
      .from("location_stock")
      .select("id, item_id, quantity")
      .eq("branch_id", branch.id);

    if (orphanError) {
      console.error(
        `Error fetching inventory for branch ${branch.id}:`,
        orphanError
      );
      continue;
    }

    console.log(`Found ${orphanedRecords.length} inventory records in branch`);

    // Check each record against items table
    let deletedCount = 0;
    for (const record of orphanedRecords) {
      // Check if the item exists
      const { data: item, error: itemError } = await supabase
        .from("items")
        .select("id")
        .eq("id", record.item_id)
        .maybeSingle();

      if (itemError) {
        console.error(`Error checking item ${record.item_id}:`, itemError);
        continue;
      }

      // If item doesn't exist, delete the inventory record
      if (!item) {
        console.log(
          `Found orphaned inventory record ${record.id} for non-existent item ${record.item_id}`
        );

        // Delete the record
        const { error: deleteError } = await supabase
          .from("location_stock")
          .delete()
          .eq("id", record.id);

        if (deleteError) {
          console.error(
            `Error deleting orphaned record ${record.id}:`,
            deleteError
          );
        } else {
          console.log(`Successfully deleted orphaned record ${record.id}`);
          deletedCount++;
        }
      }
    }

    console.log(
      `Deleted ${deletedCount} orphaned inventory records in branch ${branch.name}`
    );
  }

  console.log("Deleted items fix completed");
}

async function main() {
  console.log("Starting inventory fixes...");

  // Fix oil products
  await fixOilProducts();

  // Fix deleted items
  await fixDeletedItems();

  console.log("All fixes complete!");
}
main().catch(console.error);
