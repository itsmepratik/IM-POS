"use server";

import { unstable_cache } from "next/cache";
import { fetchInventoryItems } from "@/lib/services/inventoryService";
import { CACHE_TAGS } from "@/lib/db/cache-tags";
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
  // 1. Verify Authentication
  // We must do this outside unstable_cache because cookies() are request-specific
  const supabaseServer = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    console.error("[getInventoryServerAction] Unauthorized access attempt.");
    return { data: [], count: 0 };
  }

  // Create a stable string representation for the cache key
  const filterStr = JSON.stringify(filters || {});
  // Use a string key instead of a hash for easier debugging
  // Changed "p" to "v2-p" to bust any previously poisoned cache where batches were empty
  const cacheKeyStr = `v2-p${page}-l${limit}-s${search}-c${categoryId}-b${brandId}-f${filterStr}`;

  const getCachedData = unstable_cache(
    async () => {
      // Execute the heavy DB query via service
      // We MUST use the admin client here because unstable_cache callback
      // does not have access to cookies(), so RLS would block an anonymous client.
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
    },
    [CACHE_TAGS.inventory(locationId, cacheKeyStr)],
    {
      tags: [
        CACHE_TAGS.inventory(locationId), // Tag to invalidate this specific location's inventory
        CACHE_TAGS.ALL_PRODUCTS, // Global fallback tag
      ],
      revalidate: 3600, // 1 hour, depends on mutations to revalidate
    },
  );

  return getCachedData();
}
