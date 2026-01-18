import { z } from "zod";

// Cart item schema
export const CartItemSchema = z.object({
  productId: z.string().min(1), // Changed from .uuid() to support non-UUID IDs
  name: z.string().optional(), // Added to capture snapshot name
  quantity: z.number().positive(),
  sellingPrice: z.number().nonnegative(),
  volumeDescription: z.string().optional(),
  source: z.enum(["CLOSED", "OPEN"]).optional(), // For lubricant products - will be defaulted to CLOSED if missing
});

// Trade-in item schema
export const TradeInItemSchema = z.object({
  productId: z.string().min(1), // Changed from .uuid() to support non-UUID IDs
  quantity: z.number().positive(),
  tradeInValue: z.number().nonnegative(),
  size: z.string().min(1, "Battery size is required"),
  condition: z.enum(["scrap", "resellable", "Scrap", "Resalable"], {
    errorMap: () => ({
      message: "Condition must be either 'scrap' or 'resellable'",
    }),
  }),
  name: z.string().min(1, "Battery name is required"), // Battery size used as product name
  costPrice: z.number().nonnegative(), // Trade-in value used as cost price
});

// Discount schema
export const DiscountSchema = z.object({
  type: z.enum(["percentage", "amount"]),
  value: z.number().nonnegative(),
});

// Checkout input schema
export const CheckoutInputSchema = z.object({
  locationId: z.string().min(1), // Changed from .uuid() to support non-UUID IDs
  shopId: z.string().min(1).optional(), // Changed from .uuid() to support non-UUID IDs
  paymentMethod: z.string().min(1),
  cashierId: z.string().min(1).optional(), // Changed from .uuid() to support non-UUID IDs
  cart: z.array(CartItemSchema),
  tradeIns: z.array(TradeInItemSchema).optional(),
  discount: DiscountSchema.optional(), // Optional discount to apply
  carPlateNumber: z.string().min(1).optional(), // For 'on hold' payments
  customerId: z.string().uuid().optional(), // Optional customer ID for linking transactions to customers
  mobilePaymentAccount: z.string().optional(), // Account used for mobile payment (Adanan or Forman)
  mobileNumber: z.string().optional(), // Mobile number used for the transaction
});

// Response schemas
export const CheckoutResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      transaction: z.object({
        id: z.string(),
        referenceNumber: z.string(),
        locationId: z.string(),
        shopId: z.string().optional(),
        cashierId: z.string().optional(),
        type: z.string(),
        totalAmount: z.string(),
        itemsSold: z.array(z.any()),
        paymentMethod: z.string().optional(),
        receiptHtml: z.string().optional(),
        batteryBillHtml: z.string().optional(),
        originalReferenceNumber: z.string().optional(),
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
export type CartItem = z.infer<typeof CartItemSchema>;
export type TradeInItem = z.infer<typeof TradeInItemSchema>;
export type Discount = z.infer<typeof DiscountSchema>;
export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;
export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;

// Utility functions
// Note: generateReferenceNumber() has been moved to lib/utils/reference-numbers.ts
// to support sequential numbering with type-specific prefixes

export function calculateCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
}

export function calculateTradeInTotal(tradeIns: TradeInItem[]): number {
  return tradeIns.reduce((sum, item) => sum + item.tradeInValue, 0);
}

/**
 * Calculate discount amount based on discount type and value
 * @param subtotal - The subtotal before discount
 * @param discount - The discount object with type and value
 * @returns The calculated discount amount
 */
export function calculateDiscountAmount(
  subtotal: number,
  discount: Discount
): number {
  if (discount.type === "percentage") {
    return subtotal * (discount.value / 100);
  } else {
    // For fixed amount, ensure discount doesn't exceed subtotal
    return Math.min(discount.value, subtotal);
  }
}

/**
 * Calculate the final total after applying discount and trade-ins
 * @param cart - Array of cart items
 * @param tradeIns - Optional array of trade-in items
 * @param discount - Optional discount to apply
 * @returns Object containing subtotal, discount amount, trade-in total, and final total
 */
export function calculateFinalTotal(
  cart: CartItem[],
  tradeIns?: TradeInItem[],
  discount?: Discount
): {
  subtotalBeforeDiscount: number;
  discountAmount: number;
  tradeInTotal: number;
  finalTotal: number;
} {
  const subtotalBeforeDiscount = calculateCartTotal(cart);
  const discountAmount = discount
    ? calculateDiscountAmount(subtotalBeforeDiscount, discount)
    : 0;
  const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmount;
  const tradeInTotal = tradeIns ? calculateTradeInTotal(tradeIns) : 0;
  const finalTotal = Math.max(0, subtotalAfterDiscount - tradeInTotal);

  return {
    subtotalBeforeDiscount,
    discountAmount,
    tradeInTotal,
    finalTotal,
  };
}

export function isBatteryTransaction(items: CartItem[]): boolean {
  return items.every(
    (item) => item.volumeDescription?.toLowerCase().includes("battery") || false // We'll need to check product type from database
  );
}
