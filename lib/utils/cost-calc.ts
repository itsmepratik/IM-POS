
/**
 * Utility for parsing volumes from strings (e.g., "4L", "500ml", "4L closed bottle")
 * Uses regex to extract the volume value regardless of suffix text.
 */
export function parseVolume(volumeStr: string): number {
  const v = volumeStr.toLowerCase().trim();
  
  // Try to match patterns like "4L", "4l", "500ml", "0.5L", "4L closed bottle", etc.
  // Regex: capture a number (with optional decimal) followed by 'l' or 'ml'
  const mlMatch = v.match(/(\d+(?:\.\d+)?)\s*ml/);
  if (mlMatch) {
    return parseFloat(mlMatch[1]) / 1000; // Convert ml to liters
  }
  
  const lMatch = v.match(/(\d+(?:\.\d+)?)\s*l/);
  if (lMatch) {
    return parseFloat(lMatch[1]); // Already in liters
  }
  
  // Fallback: try to extract any leading number
  const numMatch = v.match(/^(\d+(?:\.\d+)?)/);
  if (numMatch) {
    return parseFloat(numMatch[1]); // Assume liters
  }
  
  return 0;
}

/**
 * Calculates the cost price for an item.
 * 
 * Logic:
 * 1. Base Cost = Batch Cost (if active) OR Product Cost.
 * 2. If Lubricant/Fluid:
 *    - Determine Max Volume from available volumes.
 *    - Calculate Ratio = CurrentVolume / MaxVolume.
 *    - Cost = Base Cost * Ratio.
 * 3. Else: Cost = Base Cost.
 * 
 * @param params configuration object
 */
export function calculateItemCost(params: {
  baseCost: number;
  isFluid: boolean;
  itemVolume?: string;
  allVolumeDescriptions?: string[];
}): number {
  const { baseCost, isFluid, itemVolume, allVolumeDescriptions } = params;

  if (!isFluid || !itemVolume || !allVolumeDescriptions || allVolumeDescriptions.length === 0) {
    return baseCost;
  }

  // 1. Find Max Volume for this product
  let maxVolume = 0;
  for (const volStr of allVolumeDescriptions) {
    const vol = parseVolume(volStr);
    if (vol > maxVolume) {
      maxVolume = vol;
    }
  }

  if (maxVolume === 0) return baseCost; // Should not happen if data is correct

  // 2. Parse current item volume
  const currentVolume = parseVolume(itemVolume);

  // 3. Calculate Ratio
  const ratio = currentVolume / maxVolume;

  // 4. Return proportional cost
  return baseCost * ratio;
}

/**
 * Resolves the cost price for a product using batch-first priority.
 * 
 * Priority Order:
 * 1. Active Batch cost_price (primary source of truth)
 * 2. Latest Batch cost_price (fallback)
 * 3. Product cost_price (legacy fallback)
 * 
 * @returns Object with resolved cost and source for debugging
 */
export function resolveCostPrice(params: {
  activeBatchCost?: number | string | null;
  latestBatchCost?: number | string | null;
  productCost?: number | string | null;
  productName?: string;
}): { cost: number; source: "active_batch" | "latest_batch" | "product" | "none" } {
  const { activeBatchCost, latestBatchCost, productCost } = params;

  // Helper to parse and validate cost
  const parseCost = (val: number | string | null | undefined): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === "string" ? parseFloat(val) : val;
    return isNaN(num) ? 0 : num;
  };

  // 1. Active Batch (primary)
  const activeCost = parseCost(activeBatchCost);
  if (activeCost > 0) {
    return { cost: activeCost, source: "active_batch" };
  }

  // 2. Latest Batch (secondary)
  const latestCost = parseCost(latestBatchCost);
  if (latestCost > 0) {
    return { cost: latestCost, source: "latest_batch" };
  }

  // 3. Product cost (legacy fallback)
  const prodCost = parseCost(productCost);
  if (prodCost > 0) {
    return { cost: prodCost, source: "product" };
  }

  // 4. No valid cost found
  return { cost: 0, source: "none" };
}
