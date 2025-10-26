// Test script to diagnose brand deletion issues
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function testBrandDeletion() {
  console.log("Testing brand deletion...");

  try {
    // First, get all brands
    const { data: brands, error: fetchError } = await supabase
      .from("brands")
      .select("*")
      .limit(5);

    if (fetchError) {
      console.error("Error fetching brands:", fetchError);
      return;
    }

    console.log("Found brands:", brands);

    if (brands && brands.length > 0) {
      const brandToDelete = brands[0];
      console.log("Attempting to delete brand:", brandToDelete);

      // Check if any products use this brand
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, brand_id")
        .eq("brand_id", brandToDelete.id);

      if (productsError) {
        console.error("Error checking products:", productsError);
        return;
      }

      console.log("Products using this brand:", products);

      // Attempt to delete the brand
      const { data: deleteData, error: deleteError } = await supabase
        .from("brands")
        .delete()
        .eq("id", brandToDelete.id)
        .select();

      if (deleteError) {
        console.error("Error deleting brand:", {
          error: deleteError,
          code: deleteError.code,
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint,
        });
      } else {
        console.log("Successfully deleted brand:", deleteData);
      }
    } else {
      console.log("No brands found to test deletion");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

testBrandDeletion();
