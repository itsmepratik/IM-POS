import { z } from "zod";

// Cart item schema
export const CartItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().optional(),
  quantity: z.number().positive(),
  sellingPrice: z.number().nonnegative(),
  volumeDescription: z.string().optional(),
  source: z.enum(["CLOSED", "OPEN"]).optional(),
});

// Trade-in item schema
export const TradeInItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  tradeInValue: z.number().nonnegative(),
  size: z.string().min(1, "Battery size is required"),
  condition: z.enum(["scrap", "resellable", "Scrap", "Resalable"], {
    errorMap: () => ({
      message: "Condition must be either 'scrap' or 'resellable'",
    }),
  }),
  name: z.string().min(1, "Battery name is required"),
  costPrice: z.number().nonnegative(),
});

// Discount schema
export const DiscountSchema = z.object({
  type: z.enum(["percentage", "amount"]),
  value: z.number().nonnegative(),
});

// Labor split schema
export const LaborSplitSchema = z.object({
  staffId: z.string().optional(),
  splitType: z.enum(["technician_share", "parts_portion", "labor_portion"]),
  amount: z.number().nonnegative(),
  percentage: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
});

// Service item schema (for checkout)
export const ServiceItemSchema = z.object({
  serviceId: z.string().optional(),
  name: z.string().min(1),
  amount: z.number().nonnegative(),
  quantity: z.number().positive().default(1),
  description: z.string().optional(),
  splits: z.array(LaborSplitSchema).optional(),
});

// Checkout input schema
export const CheckoutInputSchema = z.object({
  locationId: z.string().min(1),
  shopId: z.string().min(1).optional(),
  paymentMethod: z.string().min(1),
  cashierId: z.string().min(1).optional(),
  cart: z.array(CartItemSchema),
  tradeIns: z.array(TradeInItemSchema).optional(),
  discount: DiscountSchema.optional(),
  carPlateNumber: z.string().min(1).optional(),
  customerId: z.string().uuid().optional(),
  mobilePaymentAccount: z.string().optional(),
  mobileNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  services: z.array(ServiceItemSchema).optional(),
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
export type LaborSplit = z.infer<typeof LaborSplitSchema>;
export type ServiceItem = z.infer<typeof ServiceItemSchema>;

// Utility functions
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
  discount: Discount,
): number {
  if (discount.type === "percentage") {
    return subtotal * (discount.value / 100);
  } else {
    return Math.min(discount.value, subtotal);
  }
}

/**
 * Calculate the final total after applying discount and trade-ins
 */
export function calculateFinalTotal(
  cart: CartItem[],
  tradeIns?: TradeInItem[],
  discount?: Discount,
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
    (item) =>
      item.volumeDescription?.toLowerCase().includes("battery") || false,
  );
}
