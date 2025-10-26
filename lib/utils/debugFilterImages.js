const { createClient } = require("@supabase/supabase-js");

async function checkFilterImages() {
  try {
    console.log("🔍 Checking filter products and their images...");

    // Get Supabase credentials from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Supabase credentials not found");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, image_url, imageUrl, category_id, categories(name)")
      .eq("categories.name", "Filters");

    if (error) {
      console.error("❌ Error fetching products:", error);
      return;
    }

    console.log(`📦 Found ${products.length} filter products:`);

    const withImages = products.filter((p) => p.image_url || p.imageUrl);
    const withoutImages = products.filter((p) => !p.image_url && !p.imageUrl);

    console.log(`✅ Products with images: ${withImages.length}`);
    console.log(`❌ Products without images: ${withoutImages.length}`);

    if (withImages.length > 0) {
      console.log("\n📸 Products with images:");
      withImages.forEach((p) => {
        console.log(`- ${p.name}: ${p.image_url || p.imageUrl}`);
      });
    }

    if (withoutImages.length > 0) {
      console.log("\n❌ Products without images:");
      withoutImages.forEach((p) => {
        console.log(`- ${p.name}`);
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkFilterImages();
