const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

// Read from .env.local manually
const envFile = fs.readFileSync(".env.local", "utf8");
let supabaseUrl = "";
let supabaseKey = "";

envFile.split("\n").forEach((line) => {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL="))
    supabaseUrl = line.split("=")[1].trim();
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY="))
    supabaseKey = line.split("=")[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing RPC...");
  const { data, error } = await supabase.rpc("search_inventory_items_v1", {
    p_search_query: "shell",
    p_location_id: "e44d6db8-ec5b-430c-ab23-1ee60100f946",
    p_category_id: null,
    p_brand_id: null,
    p_min_price: null,
    p_max_price: null,
    p_stock_status: "all",
    p_is_battery: null,
    p_battery_state: null,
    p_limit: 50,
    p_offset: 0,
  });

  if (error) {
    console.error("RPC Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success! Data:", data?.length);
  }
}

test();
