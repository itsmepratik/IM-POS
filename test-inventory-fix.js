// Test script to verify inventory service works with fallback
import {
  fetchItems,
  fetchCategories,
  fetchBrands,
  fetchSuppliers,
  fetchBranches,
} from "./lib/services/inventoryService.js";

async function testInventoryService() {
  console.log("🧪 Testing inventory service with fallback mechanism...\n");

  try {
    console.log("📦 Testing fetchItems...");
    const items = await fetchItems();
    console.log(`✅ Found ${items.length} items`);
    if (items.length > 0) {
      console.log(`   Sample item: ${items[0].name} (${items[0].category})`);
    }

    console.log("\n🏷️  Testing fetchCategories...");
    const categories = await fetchCategories();
    console.log(
      `✅ Found ${categories.length} categories: ${categories
        .map((c) => c.name)
        .join(", ")}`
    );

    console.log("\n🏢 Testing fetchBrands...");
    const brands = await fetchBrands();
    console.log(
      `✅ Found ${brands.length} brands: ${brands
        .map((b) => b.name)
        .join(", ")}`
    );

    console.log("\n🏭 Testing fetchSuppliers...");
    const suppliers = await fetchSuppliers();
    console.log(
      `✅ Found ${suppliers.length} suppliers: ${suppliers
        .map((s) => s.name)
        .join(", ")}`
    );

    console.log("\n📍 Testing fetchBranches...");
    const branches = await fetchBranches();
    console.log(
      `✅ Found ${branches.length} branches: ${branches
        .map((b) => b.name)
        .join(", ")}`
    );

    console.log(
      "\n🎉 All tests passed! Inventory service is working with fallback data."
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testInventoryService();
