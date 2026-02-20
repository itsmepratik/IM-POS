"use server";

import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/db/cache-tags";
import { createAdminClient } from "@/supabase/admin";
import {
  createItem as serviceCreateItem,
  updateItem as serviceUpdateItem,
  deleteItem as serviceDeleteItem,
  Item,
} from "@/lib/services/inventoryService";

function invalidateCaches(locationId: string) {
  // Always invalidate the specific location's inventory and global products cache
  revalidateTag(CACHE_TAGS.inventory(locationId));
  revalidateTag(CACHE_TAGS.products(locationId));
  revalidateTag(CACHE_TAGS.ALL_PRODUCTS);
  revalidateTag(CACHE_TAGS.DASHBOARD);
}

export async function createItemAction(
  itemData: Omit<Item, "id" | "created_at" | "updated_at">,
  locationId: string = "sanaiya",
) {
  const supabase = createAdminClient();
  const result = await serviceCreateItem(itemData, locationId, supabase);
  if (result) {
    invalidateCaches(locationId);
  }
  return result;
}

export async function updateItemAction(
  id: string,
  updates: Partial<Item>,
  locationId: string = "sanaiya",
) {
  const supabase = createAdminClient();
  const result = await serviceUpdateItem(id, updates, locationId, supabase);
  if (result) {
    invalidateCaches(locationId);
  }
  return result;
}

export async function deleteItemAction(
  id: string,
  locationId: string = "sanaiya",
) {
  const supabase = createAdminClient();
  const result = await serviceDeleteItem(id, locationId, supabase);
  if (result) {
    invalidateCaches(locationId);
  }
  return result;
}
