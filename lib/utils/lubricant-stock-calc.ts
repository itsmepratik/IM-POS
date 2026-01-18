/**
 * Lubricant Stock Calculation Utility
 *
 * Single source of truth for calculating open/closed bottle counts
 * from batches and open_bottle_details tables.
 *
 * This utility ensures consistent stock calculations across:
 * - POS page (fetchItems)
 * - Inventory page (fetchInventoryItems)
 * - Product adapters
 */

export interface LubricantStockResult {
  openBottleCount: number; // Number of non-empty open bottles
  closedBottleCount: number; // Number of closed bottles (derived)
  totalOpenVolume: number; // Total volume in liters from open bottles
  totalBatchStock: number; // Sum of batches.stock_remaining
  bottleSizeUsed: number; // The bottle size used for calculation
}

export interface VolumeInfo {
  size: string;
  price: number;
}

/**
 * Extracts the numeric bottle size from a volume description string.
 * Examples: "4L" -> 4, "1 Liter" -> 1, "500ml" -> 0.5
 *
 * @param volumeDescription - The volume description string (e.g., "4L", "1 Liter")
 * @returns The numeric size in liters, or 0 if not parseable
 */
export function parseVolumeSize(volumeDescription: string): number {
  if (!volumeDescription) return 0;

  const normalized = volumeDescription.toLowerCase().trim();

  // Check for milliliters first
  const mlMatch = normalized.match(/([\d.]+)\s*ml/);
  if (mlMatch) {
    return parseFloat(mlMatch[1]) / 1000;
  }

  // Check for liters (L, Liter, Litre, etc.)
  const literMatch = normalized.match(/([\d.]+)\s*l(?:iter|itre)?s?/i);
  if (literMatch) {
    return parseFloat(literMatch[1]);
  }

  // Fallback: try to extract any number
  const numericMatch = normalized.match(/([\d.]+)/);
  if (numericMatch) {
    return parseFloat(numericMatch[1]);
  }

  return 0;
}

/**
 * Determines the primary bottle size from an array of product volumes.
 * Uses the largest volume size as the "full bottle" size.
 *
 * @param volumes - Array of product volumes
 * @param fallbackSize - Default size if no volumes found (default: 4.0L)
 * @returns The bottle size in liters
 */
export function determineBottleSize(
  volumes: VolumeInfo[],
  fallbackSize: number = 4.0
): number {
  if (!volumes || volumes.length === 0) {
    return fallbackSize;
  }

  const sizes = volumes.map((v) => parseVolumeSize(v.size));
  const maxSize = Math.max(...sizes.filter((s) => s > 0));

  return maxSize > 0 ? maxSize : fallbackSize;
}

/**
 * Calculates lubricant stock from batches and open bottle details.
 *
 * This is the SINGLE SOURCE OF TRUTH for lubricant stock calculations.
 * Both fetchItems and fetchInventoryItems should use this function.
 *
 * IMPORTANT: For lubricants, batches.stock_remaining represents BOTTLE COUNT
 * (populated from inventory.closed_bottles_stock), NOT volume in liters.
 *
 * Logic:
 * 1. Open bottle count = number of non-empty rows in open_bottle_details
 * 2. Total open volume = sum of current_volume from open_bottle_details
 * 3. Closed bottle count = batch stock remaining (directly, as it's already a bottle count)
 *
 * @param batchStockRemaining - Sum of stock_remaining from all batches (BOTTLE COUNT for lubricants)
 * @param openBottleRows - Array of { current_volume } from open_bottle_details (non-empty bottles)
 * @param volumes - Array of product volumes (used for bottle size reference, but not for division)
 * @param fallbackBottleSize - Default bottle size if no volumes found (used for reference only)
 */
export function calculateLubricantStock(
  batchStockRemaining: number | null,
  openBottleRows: Array<{ current_volume: string | number }> | null,
  volumes: VolumeInfo[],
  fallbackBottleSize: number = 4.0
): LubricantStockResult {
  // Calculate open bottles data
  const measuredOpenCount = openBottleRows?.length ?? 0;
  const totalOpenVolume =
    openBottleRows?.reduce(
      (sum, b) => sum + (parseFloat(String(b.current_volume)) || 0),
      0
    ) ?? 0;

  // Determine bottle size from volumes (for reference/display purposes)
  const bottleSize = determineBottleSize(volumes, fallbackBottleSize);

  // For lubricants, batchStockRemaining IS the closed bottle count directly
  // (it's populated from inventory.closed_bottles_stock, which is a bottle count)
  // We do NOT divide by bottle size - the value is already in "bottles" unit
  const closedBottleCount = batchStockRemaining !== null && batchStockRemaining > 0
    ? Math.floor(batchStockRemaining) // Ensure integer (in case there's any floating point)
    : 0;

  return {
    openBottleCount: measuredOpenCount,
    closedBottleCount,
    totalOpenVolume,
    totalBatchStock: batchStockRemaining ?? 0,
    bottleSizeUsed: bottleSize,
  };
}

/**
 * Legacy fallback calculation using inventory table columns directly.
 * Used when batches are not available (for backward compatibility).
 *
 * @param openBottlesStock - Value from inventory.open_bottles_stock
 * @param closedBottlesStock - Value from inventory.closed_bottles_stock
 */
export function calculateLubricantStockLegacy(
  openBottlesStock: number | null,
  closedBottlesStock: number | null
): Pick<LubricantStockResult, "openBottleCount" | "closedBottleCount"> {
  return {
    openBottleCount: openBottlesStock ?? 0,
    closedBottleCount: closedBottlesStock ?? 0,
  };
}
