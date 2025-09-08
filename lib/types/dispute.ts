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
  cashierId: z.string().uuid().optional(),
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
export function generateDisputeReferenceNumber(
  disputeType: "REFUND" | "WARRANTY_CLAIM"
): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  const prefix = disputeType === "REFUND" ? "REF" : "WAR";
  return `${prefix}${timestamp}${random}`;
}

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

export function isBatteryDispute(items: DisputedItem[]): boolean {
  return items.some(
    (item) => item.volumeDescription?.toLowerCase().includes("battery") || false
  );
}
