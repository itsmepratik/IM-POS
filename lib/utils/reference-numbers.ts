import { db, queryClient } from "@/lib/db/client";
import { referenceNumberCounters, shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Maps transaction context to the correct reference number prefix
 */
function getPrefixForTransaction(
  transactionType: string,
  isBatterySale: boolean,
): string {
  if (transactionType === "WARRANTY_CLAIM") return "WB";
  if (transactionType === "REFUND") return "R";
  if (transactionType === "ON_HOLD") return "OH";
  if (transactionType === "STOCK_TRANSFER") return "ST";
  if (isBatterySale) return "B";
  return "A";
}

/**
 * Generates a sequential reference number for a transaction
 * Format: [PREFIX][SALE_NUM_MONTH][SHOP_NUM][ZIP_CODE][MMYY]
 * Example: A001013190326
 *
 * @param transactionType - The transaction type (SALE, REFUND, ON_HOLD, WARRANTY_CLAIM, etc.)
 * @param isBatterySale - Whether this is a battery sale
 * @param paymentMethod - The payment method (unused but kept for backwards compatibility)
 * @param shopId - The shop ID to pull shopCode and zipCode
 * @returns A formatted reference number like "A001013190326"
 */
export async function generateReferenceNumber(
  transactionType: string,
  isBatterySale: boolean,
  paymentMethod: string,
  shopId?: string | null,
): Promise<string> {
  const prefix = getPrefixForTransaction(transactionType, isBatterySale);

  let shopCode = "01";
  let zipCode = "319";

  if (shopId) {
    const shopResult = await db!
      .select({ shopCode: shops.shopCode, zipCode: shops.zipCode })
      .from(shops)
      .where(eq(shops.id, shopId))
      .limit(1);
    if (shopResult.length > 0) {
      shopCode = shopResult[0].shopCode || "01";
      zipCode = shopResult[0].zipCode || "319";
    }
  }

  // Get the current date mapped to UAE timezone to ensure accurate midnight rollovers
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" }),
  );
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const year = now.getFullYear().toString().slice(-2);
  const mmyy = `${month}${year}`;

  // Use a unique counter key per prefix, shop, and month so it resets every month for each shop independently
  // E.g. A_01_0326, B_02_0326
  const counterKey = `${prefix}_${shopCode}_${mmyy}`;

  // Use raw SQL query with RETURNING to atomically increment and return the counter
  const result = await queryClient!`
    INSERT INTO reference_number_counters (prefix, counter, updated_at)
    VALUES (${counterKey}, 0, now())
    ON CONFLICT (prefix) DO UPDATE
    SET 
      counter = reference_number_counters.counter + 1,
      updated_at = now()
    RETURNING counter
  `;

  if (!result || result.length === 0) {
    throw new Error(`Failed to increment counter for prefix: ${counterKey}`);
  }

  let counterValue = result[0].counter;

  if (counterValue === 0) {
    const updateResult = await queryClient!`
      UPDATE reference_number_counters
      SET counter = 1, updated_at = now()
      WHERE prefix = ${counterKey} AND counter = 0
      RETURNING counter
    `;
    counterValue = updateResult[0]?.counter || 1;
  }

  // Format with leading zeros (3 digits: 001-999, as per example A001013190326)
  // [SALE_NUM_MONTH]
  const paddedNumber = counterValue.toString().padStart(3, "0");

  return `${prefix}${paddedNumber}${shopCode}${zipCode}${mmyy}`;
}
