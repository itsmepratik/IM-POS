import { z } from "zod";

// Disputed item schema
export const DisputedItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  sellingPrice: z.number().nonnegative(),
  volumeDescription: z.string().optional(),
});

// Dispute input schema
export const DisputeInputSchema = z.object({
  originalBillNumber: z.string().min(1, "Original bill number is required"),
  disputeType: z.enum(["REFUND", "WARRANTY_CLAIM"], {
    errorMap: () => ({
      message: "Dispute type must be either REFUND or WARRANTY_CLAIM",
    }),
  }),
  locationId: z.string().uuid(),
  shopId: z.string().uuid().optional(),
  cashierId: z.string().min(1).optional(), // Accepts staff_id text (e.g., "0010") which will be converted to UUID
  disputedItems: z
    .array(DisputedItemSchema)
    .min(1, "At least one disputed item is required"),
});

// Dispute response schema
export const DisputeResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      disputeTransaction: z.object({
        id: z.string(),
        referenceNumber: z.string(),
        originalReferenceNumber: z.string(),
        type: z.string(),
        totalAmount: z.string(),
        locationId: z.string(),
        shopId: z.string().optional(),
        cashierId: z.string().optional(),
        itemsSold: z.array(z.any()),
        receiptHtml: z.string().optional(),
        batteryBillHtml: z.string().optional(),
        createdAt: z.date(),
      }),
      originalTransaction: z.object({
        id: z.string(),
        referenceNumber: z.string(),
        type: z.string(),
        totalAmount: z.string(),
        itemsSold: z.array(z.any()),
        createdAt: z.date(),
      }),
      receiptHtml: z.string().optional(),
      batteryBillHtml: z.string().optional(),
      isBattery: z.boolean(),
    })
    .optional(),
  error: z.string().optional(),
  details: z.array(z.any()).optional(),
});

// Type exports
export type DisputedItem = z.infer<typeof DisputedItemSchema>;
export type DisputeInput = z.infer<typeof DisputeInputSchema>;
export type DisputeResponse = z.infer<typeof DisputeResponseSchema>;

// Utility functions
// Note: generateDisputeReferenceNumber() has been moved to lib/utils/reference-numbers.ts
// to support sequential numbering with type-specific prefixes (WBX for warranty claims)

export function calculateDisputeTotal(
  disputedItems: DisputedItem[],
  disputeType: "REFUND" | "WARRANTY_CLAIM"
): number {
  const total = disputedItems.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0
  );
  // For refunds, make the total negative
  return disputeType === "REFUND" ? -total : total;
}

/**
 * Helper function to check if a product type string indicates a battery
 */
function isBatteryType(type?: string | null): boolean {
  if (!type) return false;
  const normalizedType = type.toLowerCase().trim();
  return normalizedType === "battery" || normalizedType === "batteries";
}

/**
 * Check if disputed items contain battery products
 * This function checks volumeDescription as a fallback, but ideally
 * product records should be checked using isBatteryTransaction()
 */
export function isBatteryDispute(items: DisputedItem[]): boolean {
  return items.some(
    (item) => item.volumeDescription?.toLowerCase().includes("battery") || false
  );
}

/**
 * Validate if a transaction contains ONLY battery products
 * This should be used with product records fetched from the database
 * 
 * @param productRecords - Array of product records with categoryName and productType/typeName
 * @returns true if ALL products are batteries, false otherwise
 */
export function isBatteryTransaction(productRecords: Array<{
  categoryName?: string | null;
  productType?: string | null;
  typeName?: string | null;
}>): boolean {
  if (productRecords.length === 0) return false;
  
  return productRecords.every((product) => {
    const categoryName = product.categoryName;
    const productType = product.productType || product.typeName;
    
    // Battery products are in "Parts" category with type "battery" or "batteries"
    return categoryName === "Parts" && isBatteryType(productType);
  });
}
