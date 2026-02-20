import { createAdminClient } from "./supabase/admin";
import { fetchItem } from "./lib/services/inventoryService";

async function main() {
  const adminClient = createAdminClient();
  const locationId = "sanaiya";

  const { data } = await adminClient
    .from("batches")
    .select("inventory_id")
    .limit(1);
  if (!data || data.length === 0) {
    console.log("no batches in db");
    return;
  }

  const { data: invData } = await adminClient
    .from("inventory")
    .select("product_id")
    .eq("id", data[0].inventory_id)
    .limit(1);

  const productId = invData[0].product_id;
  console.log("Found product ID from batches:", productId);

  const item = await fetchItem(productId, locationId, adminClient);
  console.log("Returned item name:", item?.name);
  console.log("Item batches length:", item?.batches?.length);
  console.log("Batches:", JSON.stringify(item?.batches || [], null, 2));
}

main().catch(console.error);
