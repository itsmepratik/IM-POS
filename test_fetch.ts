import { createAdminClient } from "./supabase/admin";
import { fetchItem } from "./lib/services/inventoryService";

async function main() {
  const adminClient = createAdminClient();
  const locationId = "sanaiya"; // or whatever

  // Find the ACDelco product ID from products table first, or just fetch any item.
  // Actually let's fetch inventory items first.
  const { data } = await adminClient
    .from("products")
    .select("id, name")
    .ilike("name", "%ACDelco%")
    .limit(1);
  if (!data || data.length === 0) {
    console.log("No ACDelco product found");
    return;
  }

  const productId = data[0].id;
  console.log("Found product:", data[0].name, productId);

  const item = await fetchItem(productId, locationId, adminClient);
  console.log("Batches:", JSON.stringify(item?.batches || [], null, 2));
}

main().catch(console.error);
