
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";


const supabaseUrl = "https://dyrxksfiqlgypkebfidr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cnhrc2ZpcWxneXBrZWJmaWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTc1MTgsImV4cCI6MjA3MDU5MzUxOH0.hREVNhdSflqe5XW7NHDNTn0SSYlspdVIKrAySTyFE1A";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBatteries() {
  console.log("Checking types...");
  const { data: types, error: typeError } = await supabase
    .from("types")
    .select("id, name")
    .ilike("name", "%battery%");
  
  if (typeError) {
    console.error("Error fetching types:", typeError);
  } else {
    console.log("Found battery types:", types);
  }

  console.log("\nChecking all products (first 10)...");
  const { data: allProducts, error: allError } = await supabase
    .from("products")
    .select("id, name, is_battery, battery_state, type_id, product_type")
    .limit(10);
    
  if (allError) console.error("Error fetching all products:", allError);
  else {
    console.log(`Sample of products:`);
    allProducts.forEach(p => console.log(`- ${p.name}: is_battery=${p.is_battery}, state=${p.battery_state}, type_id=${p.type_id}, product_type=${p.product_type}`));
  }

  console.log("\nChecking products...");
  // Check products with type_id matching battery types
  if (types && types.length > 0) {
    const typeIds = types.map(t => t.id);
    const { data: productsByType, error: prodError } = await supabase
      .from("products")
      .select("id, name, is_battery, battery_state, type_id")
      .in("type_id", typeIds);
      
    if (prodError) console.error("Error fetching products by type:", prodError);
    else {
      console.log(`Found ${productsByType.length} products linked to battery types:`);
      productsByType.forEach(p => console.log(`- ${p.name}: is_battery=${p.is_battery}, state=${p.battery_state}`));
    }
  }

  // Check products with is_battery = true
  const { data: batteryProducts, error: batError } = await supabase
    .from("products")
    .select("id, name, is_battery, battery_state")
    .eq("is_battery", true);

  if (batError) console.error("Error fetching battery products:", batError);
  else {
    console.log(`\nFound ${batteryProducts.length} products with is_battery=true:`);
    batteryProducts.forEach(p => console.log(`- ${p.name}: state=${p.battery_state}`));
  }
}

checkBatteries();
