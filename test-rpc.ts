import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing RPC v2...");
  const { data, error } = await supabase.rpc("search_inventory_items_v2", {
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
