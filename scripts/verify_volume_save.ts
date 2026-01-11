
import { updateItem, fetchItem, createItem, deleteItem } from "../lib/services/inventoryService";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

async function runTest() {
  console.log("🚀 Starting Volume Save Verification...");

  // 1. Create a test item (Oil)
  console.log("\n--- Step 1: Creating Test Item ---");
  // Fetch a valid category
  const { data: categories } = await supabase.from("categories").select("id").limit(1);
  if (!categories || categories.length === 0) {
      console.error("❌ No categories found.");
      return;
  }
  const categoryId = categories[0].id;

  const testItemData = {
    name: "Test Oil Product " + Date.now(),
    category_id: categoryId,
    isOil: true,
    stock: 10,
    price: 100,
    costPrice: 50,
    brand: "Test Brand",
    type: "Test Type",
    description: "Temporary test item for volume verification",
    volumes: [
      { size: "1L", price: 20 },
      { size: "4L", price: 75 }
    ]
  };

  // We need to fetch location ID first or let createItem handle it
  // Assuming 'sanaiya' is valid
  
  const createdItem = await createItem(testItemData as any);
  
  if (!createdItem) {
    console.error("❌ Failed to create test item.");
    return;
  }

  console.log(`✅ Created item: ${createdItem.name} (${createdItem.id})`);
  console.log("Initial volumes:", JSON.stringify(createdItem.volumes, null, 2));

  if (!createdItem.volumes || createdItem.volumes.length !== 2) {
    console.error("❌ Volumes were not saved during creation!");
  } else {
    console.log("✅ Volumes saved correctly during creation.");
  }

  // 2. Update the item (Add/Remove/Modify Volumes)
  console.log("\n--- Step 2: Updating Item Volumes ---");
  
  // Modify: Change price of 1L
  // Remove: 4L (by omission)
  // Add: 5L
  const updateData = {
    isOil: true,
    volumes: [
      { size: "1L", price: 25 }, // Changed price
      { size: "5L", price: 90 }  // New volume
    ]
  };

  const updatedItem = await updateItem(createdItem.id, updateData as any);

  if (!updatedItem) {
    console.error("❌ Failed to update item.");
  } else {
    console.log("✅ Updated item volumes.");
    console.log("Updated volumes:", JSON.stringify(updatedItem.volumes, null, 2));

    // Verify
    const vol1L = updatedItem.volumes?.find(v => v.size === "1L");
    const vol5L = updatedItem.volumes?.find(v => v.size === "5L");
    const vol4L = updatedItem.volumes?.find(v => v.size === "4L");

    if (vol1L && vol1L.price === 25 && vol5L && !vol4L) {
      console.log("✅ Volume updates verification passed: 1L updated, 5L added, 4L removed.");
    } else {
      console.error("❌ Volume updates verification FAILED.");
      console.log("Expected: 1L@25, 5L@90, 4L removed");
    }
  }

  // 3. Cleanup
  console.log("\n--- Step 3: Cleanup ---");
  await deleteItem(createdItem.id);
  console.log("✅ Test item deleted.");
}

runTest().catch(console.error);
