import { z } from "zod";

// Trade-in price schema
export const TradeInPriceSchema = z.object({
  id: z.string().uuid(),
  size: z.string().min(1, "Size is required"),
  condition: z.enum(["Scrap", "Resalable"], {
    errorMap: () => ({
      message: "Condition must be either 'Scrap' or 'Resalable'",
    }),
  }),
  tradeInValue: z.number().min(0, "Trade-in value must be non-negative"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Trade-in transaction schema
export const TradeInTransactionSchema = z.object({
  id: z.string().uuid(),
  transactionId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive("Quantity must be positive"),
  tradeInValue: z.number().min(0, "Trade-in value must be non-negative"),
  createdAt: z.date(),
});

// Create trade-in price input schema
export const CreateTradeInPriceSchema = z.object({
  size: z.string().min(1, "Size is required"),
  condition: z.enum(["Scrap", "Resalable"], {
    errorMap: () => ({
      message: "Condition must be either 'Scrap' or 'Resalable'",
    }),
  }),
  tradeInValue: z.number().min(0, "Trade-in value must be non-negative"),
});

// Update trade-in price input schema
export const UpdateTradeInPriceSchema = z.object({
  id: z.string().uuid(),
  tradeInValue: z.number().min(0, "Trade-in value must be non-negative"),
});

// Trade-in price query schema
export const TradeInPriceQuerySchema = z.object({
  size: z.string().optional(),
  condition: z.enum(["Scrap", "Resalable"]).optional(),
});

// Trade-in calculation schema
export const TradeInCalculationSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive("Quantity must be positive"),
  size: z.string().min(1, "Size is required"),
  condition: z.enum(["Scrap", "Resalable"], {
    errorMap: () => ({
      message: "Condition must be either 'Scrap' or 'Resalable'",
    }),
  }),
});

// Trade-in calculation result schema
export const TradeInCalculationResultSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  size: z.string(),
  condition: z.enum(["Scrap", "Resalable"]),
  unitValue: z.number().min(0),
  totalValue: z.number().min(0),
  isValid: z.boolean(),
  error: z.string().optional(),
});

// Type exports
export type TradeInPrice = z.infer<typeof TradeInPriceSchema>;
export type TradeInTransaction = z.infer<typeof TradeInTransactionSchema>;
export type CreateTradeInPrice = z.infer<typeof CreateTradeInPriceSchema>;
export type UpdateTradeInPrice = z.infer<typeof UpdateTradeInPriceSchema>;
export type TradeInPriceQuery = z.infer<typeof TradeInPriceQuerySchema>;
export type TradeInCalculation = z.infer<typeof TradeInCalculationSchema>;
export type TradeInCalculationResult = z.infer<
  typeof TradeInCalculationResultSchema
>;

// Battery condition enum
export const BatteryCondition = {
  SCRAP: "Scrap",
  RESALABLE: "Resalable",
} as const;

export type BatteryConditionType =
  (typeof BatteryCondition)[keyof typeof BatteryCondition];

// Common battery sizes
export const BatterySizes = {
  SIZE_40: "40",
  SIZE_50: "50",
  SIZE_60: "60",
  SIZE_70: "70",
  SIZE_80: "80",
  SIZE_100: "100",
} as const;

export type BatterySizeType = (typeof BatterySizes)[keyof typeof BatterySizes];

// Utility functions
export function calculateTradeInValue(
  size: string,
  condition: BatteryConditionType,
  quantity: number,
  tradeInPrices: TradeInPrice[]
): TradeInCalculationResult {
  const price = tradeInPrices.find(
    (p) => p.size === size && p.condition === condition
  );

  if (!price) {
    return {
      productId: "",
      quantity,
      size,
      condition,
      unitValue: 0,
      totalValue: 0,
      isValid: false,
      error: `No trade-in price found for size ${size} and condition ${condition}`,
    };
  }

  const totalValue = price.tradeInValue * quantity;

  return {
    productId: "",
    quantity,
    size,
    condition,
    unitValue: price.tradeInValue,
    totalValue,
    isValid: true,
  };
}

export function validateBatterySize(size: string): boolean {
  return Object.values(BatterySizes).includes(size as BatterySizeType);
}

export function validateBatteryCondition(
  condition: string
): condition is BatteryConditionType {
  return Object.values(BatteryCondition).includes(
    condition as BatteryConditionType
  );
}

// Error types
export class TradeInPriceNotFoundError extends Error {
  constructor(size: string, condition: BatteryConditionType) {
    super(
      `Trade-in price not found for size ${size} and condition ${condition}`
    );
    this.name = "TradeInPriceNotFoundError";
  }
}

export class InvalidBatterySizeError extends Error {
  constructor(size: string) {
    super(
      `Invalid battery size: ${size}. Valid sizes are: ${Object.values(
        BatterySizes
      ).join(", ")}`
    );
    this.name = "InvalidBatterySizeError";
  }
}

export class InvalidBatteryConditionError extends Error {
  constructor(condition: string) {
    super(
      `Invalid battery condition: ${condition}. Valid conditions are: ${Object.values(
        BatteryCondition
      ).join(", ")}`
    );
    this.name = "InvalidBatteryConditionError";
  }
}
