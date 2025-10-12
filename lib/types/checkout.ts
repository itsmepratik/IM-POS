import { z } from "zod";

// Cart item schema
export const CartItemSchema = z.object({
  productId: z.string().min(1), // Changed from .uuid() to support non-UUID IDs
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
  condition: z.enum(["Scrap", "Resalable"], {
    errorMap: () => ({
      message: "Condition must be either 'Scrap' or 'Resalable'",
    }),
  }),
});

// Checkout input schema
export const CheckoutInputSchema = z.object({
  locationId: z.string().min(1), // Changed from .uuid() to support non-UUID IDs
  shopId: z.string().min(1).optional(), // Changed from .uuid() to support non-UUID IDs
  paymentMethod: z.string().min(1),
  cashierId: z.string().min(1).optional(), // Changed from .uuid() to support non-UUID IDs
  cart: z.array(CartItemSchema),
  tradeIns: z.array(TradeInItemSchema).optional(),
  carPlateNumber: z.string().min(1).optional(), // For 'on hold' payments
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
export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;
export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;

// Utility functions
export function generateReferenceNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `TXN${timestamp}${random}`;
}

export function calculateCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
}

export function calculateTradeInTotal(tradeIns: TradeInItem[]): number {
  return tradeIns.reduce((sum, item) => sum + item.tradeInValue, 0);
}

export function calculateFinalTotal(
  cart: CartItem[],
  tradeIns?: TradeInItem[]
): number {
  const cartTotal = calculateCartTotal(cart);
  const tradeInTotal = tradeIns ? calculateTradeInTotal(tradeIns) : 0;
  return cartTotal - tradeInTotal;
}

export function isBatteryTransaction(items: CartItem[]): boolean {
  return items.every(
    (item) => item.volumeDescription?.toLowerCase().includes("battery") || false // We'll need to check product type from database
  );
}
