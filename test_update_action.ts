import { updateItemAction } from "./lib/actions/mutations";
import { createAdminClient } from "./supabase/admin";

async function main() {
  const adminClient = createAdminClient();
  const locationId = "sanaiya";

  const { data } = await adminClient
    .from("batches")
    .select("inventory_id")
    .limit(1);
  if (!data || data.length === 0) return;
  const { data: invData } = await adminClient
    .from("inventory")
    .select("product_id")
    .eq("id", data[0].inventory_id)
    .limit(1);
  const productId = invData[0].product_id;

  console.log("Updating product:", productId);
  const result = await updateItemAction(
    productId,
    { name: "Test update" },
    locationId,
  );
  console.log("Returned item batches length:", result?.batches?.length);
}

main().catch(console.error);
