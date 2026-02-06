import { db, queryClient } from "@/lib/db/client";
import { referenceNumberCounters } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Maps transaction context to the correct reference number prefix
 */
function getPrefixForTransaction(
  transactionType: string,
  isBatterySale: boolean,
  paymentMethod: string
): string {
  // Battery sales always use B prefix regardless of transaction type
  if (isBatterySale) {
    return "B";
  }

  // Map transaction types to prefixes
  switch (transactionType.toUpperCase()) {
    case "ON_HOLD":
      return "OH";
    case "CREDIT":
      return "CR";
    case "WARRANTY_CLAIM":
      return "WBX";
    case "STOCK_TRANSFER":
      return "ST";
    case "REFUND":
      return "R";
    case "SALE":
    case "ON_HOLD_PAID":
    case "CREDIT_PAID":
    default:
      // Default to A for regular sales and settlements
      return "A";
  }
}

/**
 * Generates a sequential reference number for a transaction
 * Uses database-level locking to ensure thread-safe counter increments
 * 
 * @param transactionType - The transaction type (SALE, CREDIT, ON_HOLD, etc.)
 * @param isBatterySale - Whether this is a battery sale
 * @param paymentMethod - The payment method
 * @returns A formatted reference number like "A0001", "OH0023", "B0015"
 */
export async function generateReferenceNumber(
  transactionType: string,
  isBatterySale: boolean,
  paymentMethod: string
): Promise<string> {
  const prefix = getPrefixForTransaction(
    transactionType,
    isBatterySale,
    paymentMethod
  );

  // Use raw SQL query with RETURNING to atomically increment and return the counter
  // This uses PostgreSQL's built-in atomicity to ensure thread-safe increments
  // Since counters are initialized at 0, first transaction will increment to 1
  const result = await queryClient!`
    INSERT INTO reference_number_counters (prefix, counter, updated_at)
    VALUES (${prefix}, 0, now())
    ON CONFLICT (prefix) DO UPDATE
    SET 
      counter = reference_number_counters.counter + 1,
      updated_at = now()
    RETURNING counter
  `;

  if (!result || result.length === 0) {
    throw new Error(`Failed to increment counter for prefix: ${prefix}`);
  }

  let counterValue = result[0].counter;
  
  // Handle edge case: if counter is still 0 (row was just created), increment to 1
  // This shouldn't happen since counters are pre-initialized, but safety check
  if (counterValue === 0) {
    const updateResult = await queryClient!`
      UPDATE reference_number_counters
      SET counter = 1, updated_at = now()
      WHERE prefix = ${prefix} AND counter = 0
      RETURNING counter
    `;
    counterValue = updateResult[0]?.counter || 1;
  }

  // Format with leading zeros (4 digits: 0001-9999)
  const paddedNumber = counterValue.toString().padStart(4, "0");
  return `${prefix}${paddedNumber}`;
}

