import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { createAdminClient } from "@/supabase/admin"; // Using admin client to bypass RLS for testing

export async function GET() {
  const adminClient = createAdminClient();

  // Get a valid location_id from inventory
  const { data: invData } = await adminClient
    .from("inventory")
    .select("location_id")
    .limit(1);
  const actualLocationId = invData?.[0]?.location_id;

  if (!actualLocationId) {
    return NextResponse.json({
      success: false,
      error: "No location found in DB",
    });
  }

  const search = "shell";

  const { data: rpcData, error: rpcError } = await adminClient.rpc(
    "search_inventory_items_v2",
    {
      p_search_query: search,
      p_location_id: actualLocationId,
      p_category_id: null,
      p_brand_id: null,
      p_min_price: null,
      p_max_price: null,
      p_stock_status: "all",
      p_is_battery: null,
      p_battery_state: null,
      p_limit: 50,
      p_offset: 0,
    },
  );

  return NextResponse.json({
    success: !rpcError,
    error: rpcError,
    data: rpcData,
  });
}
