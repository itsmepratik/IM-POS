import { createAdminClient } from "./supabase/admin";
import { fetchInventoryItems } from "./lib/services/inventoryService";

async function main() {
  const adminClient = createAdminClient();
  const locationId = "sanaiya";

  const result = await fetchInventoryItems(
    1,
    50,
    "",
    "all",
    "all",
    locationId,
    {},
    adminClient,
  );

  console.log("Returned items:", result.data.length);
  const itemsWithBatches = result.data.filter(
    (i) => i.batches && i.batches.length > 0,
  );
  console.log("Items with batches:", itemsWithBatches.length);

  if (itemsWithBatches.length > 0) {
    console.log("Example item:", itemsWithBatches[0].name);
    console.log(
      "Batches array:",
      JSON.stringify(itemsWithBatches[0].batches || [], null, 2),
    );
  }
}

main().catch(console.error);
