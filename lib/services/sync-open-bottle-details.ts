import {
  determineBottleSize,
  type VolumeInfo,
} from "@/lib/utils/lubricant-stock-calc";

/**
 * Reads product_volumes and returns the largest bottle size in liters
 * (same rule as POS lubricant stock helpers).
 */
export async function fetchMaxBottleLitersForProduct(
  sb: { from: (t: string) => any },
  productId: string,
): Promise<number> {
  const { data: volRows, error } = await sb
    .from("product_volumes")
    .select("volume_description")
    .eq("product_id", productId);

  if (error) {
    console.error("fetchMaxBottleLitersForProduct:", error);
    return 4.0;
  }

  const volumeInfos: VolumeInfo[] = (volRows || []).map((v: any) => ({
    size: v.volume_description,
    price: 0,
  }));

  return determineBottleSize(volumeInfos, 4.0);
}

/**
 * Makes `open_bottle_details` match `openBottleCount` for one inventory row:
 * - Deletes all existing rows for that inventory (clears stale / zero-volume junk).
 * - Inserts `openBottleCount` rows with `is_empty = false`, `initial_volume` and
 *   `current_volume` set to the largest volume SKU for the product (e.g. 4L or 5L).
 * - When count is 0, only deletes — no empty placeholder rows.
 */
export async function syncOpenBottleDetailsToOpenCount(
  sb: { from: (t: string) => any },
  params: {
    inventoryId: string;
    productId: string;
    openBottleCount: number;
  },
): Promise<{ ok: boolean; error?: string }> {
  const count = Math.max(0, Math.floor(Number(params.openBottleCount) || 0));
  const liters = await fetchMaxBottleLitersForProduct(sb, params.productId);
  const volStr = String(liters);

  const { error: delErr } = await sb
    .from("open_bottle_details")
    .delete()
    .eq("inventory_id", params.inventoryId);

  if (delErr) {
    console.error("syncOpenBottleDetailsToOpenCount: delete failed", delErr);
    return { ok: false, error: delErr.message };
  }

  if (count === 0) {
    return { ok: true };
  }

  const now = new Date().toISOString();
  const rows = Array.from({ length: count }, () => ({
    inventory_id: params.inventoryId,
    initial_volume: volStr,
    current_volume: volStr,
    is_empty: false,
    opened_at: now,
  }));

  const { error: insErr } = await sb.from("open_bottle_details").insert(rows);
  if (insErr) {
    console.error("syncOpenBottleDetailsToOpenCount: insert failed", insErr);
    return { ok: false, error: insErr.message };
  }

  return { ok: true };
}
