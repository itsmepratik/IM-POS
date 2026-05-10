"use server";

import { fetchInventoryItems } from "@/lib/services/inventoryService";
import { createClient } from "@/supabase/server";
import { createAdminClient } from "@/supabase/admin";

export async function getInventoryServerAction(
  page: number = 1,
  limit: number = 50,
  search: string = "",
  categoryId: string = "all",
  brandId: string = "all",
  locationId: string = "sanaiya",
  filters: {
    minPrice?: number;
    maxPrice?: number;
    stockStatus?: "all" | "in-stock" | "low-stock" | "out-of-stock";
    showLowStockOnly?: boolean;
    showOutOfStockOnly?: boolean;
    showInStock?: boolean;
    showBatteries?: boolean;
    batteryState?: "new" | "scrap" | "resellable";
    sortBy?: "name" | "price";
    sortOrder?: "asc" | "desc";
  } = {},
) {
  const supabaseServer = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    console.error("[getInventoryServerAction] Unauthorized access attempt.");
    return { data: [], count: 0 };
  }

  // No unstable_cache here: inventory must reflect the DB immediately (including
  // changes made directly in Supabase). A 1-hour cache caused stale bottle counts.

  const adminClient = createAdminClient();
  return fetchInventoryItems(
    page,
    limit,
    search,
    categoryId,
    brandId,
    locationId,
    filters,
    adminClient,
  );
}
