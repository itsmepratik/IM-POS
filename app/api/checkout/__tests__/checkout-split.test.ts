import { describe, it, expect } from "vitest";
import {
  CheckoutInputSchema,
  SplitLegSchema,
} from "@/lib/types/checkout";

/**
 * TDD RED — checkout schema must accept a cash/card split.
 *
 * Contract under test (schema extensions do not exist yet):
 * - paymentMethod "SPLIT" is accepted with a `splitPayments` breakdown of
 *   exactly two legs: CASH + CARD, each > 0.
 * - Single methods (CASH/CARD/MOBILE/CREDIT/ON_HOLD) keep working without
 *   a breakdown.
 * - Negative / zero / wrong-method legs are rejected.
 */
describe("SplitLegSchema", () => {
  it("accepts a positive cash leg", () => {
    const parsed = SplitLegSchema.safeParse({ method: "CASH", amount: 4.0 });
    expect(parsed.success).toBe(true);
  });

  it("rejects zero and negative amounts", () => {
    expect(
      SplitLegSchema.safeParse({ method: "CASH", amount: 0 }).success,
    ).toBe(false);
    expect(
      SplitLegSchema.safeParse({ method: "CARD", amount: -1 }).success,
    ).toBe(false);
  });

  it("rejects non-cash/card legs", () => {
    expect(
      SplitLegSchema.safeParse({ method: "MOBILE", amount: 1 }).success,
    ).toBe(false);
    expect(
      SplitLegSchema.safeParse({ method: "CREDIT", amount: 1 }).success,
    ).toBe(false);
  });
});

describe("CheckoutInputSchema - split checkout", () => {
  const baseCart = [
    { productId: "11111111-1111-1111-1111-111111111111", quantity: 1, sellingPrice: 6.5 },
  ];

  it("accepts SPLIT with a cash + card breakdown", () => {
    const parsed = CheckoutInputSchema.safeParse({
      locationId: "loc-1",
      shopId: "shop-1",
      paymentMethod: "SPLIT",
      cart: baseCart,
      splitPayments: [
        { method: "CASH", amount: 4.0 },
        { method: "CARD", amount: 2.5 },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects SPLIT without a breakdown", () => {
    const parsed = CheckoutInputSchema.safeParse({
      locationId: "loc-1",
      paymentMethod: "SPLIT",
      cart: baseCart,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects SPLIT with a single leg", () => {
    const parsed = CheckoutInputSchema.safeParse({
      locationId: "loc-1",
      paymentMethod: "SPLIT",
      cart: baseCart,
      splitPayments: [{ method: "CASH", amount: 6.5 }],
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts the client-encoded SPLIT method string with a breakdown", () => {
    // Regression: useCheckout sends the encoded method
    // (SPLIT_CASH_<cash>_CARD_<card>), not the literal "SPLIT".
    // Rejecting it caused "Transaction Recording Issue" on every split sale.
    const parsed = CheckoutInputSchema.safeParse({
      locationId: "loc-1",
      shopId: "shop-1",
      paymentMethod: "SPLIT_CASH_4.000_CARD_2.500",
      cart: baseCart,
      splitPayments: [
        { method: "CASH", amount: 4.0 },
        { method: "CARD", amount: 2.5 },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects the encoded SPLIT method string without a breakdown", () => {
    const parsed = CheckoutInputSchema.safeParse({
      locationId: "loc-1",
      paymentMethod: "SPLIT_CASH_4.000_CARD_2.500",
      cart: baseCart,
    });
    expect(parsed.success).toBe(false);
  });

  it("still accepts single-method checkouts without splitPayments", () => {
    for (const method of ["CASH", "CARD", "MOBILE", "CREDIT", "ON_HOLD"]) {
      const parsed = CheckoutInputSchema.safeParse({
        locationId: "loc-1",
        paymentMethod: method,
        cart: baseCart,
      });
      expect(parsed.success).toBe(true);
    }
  });
});
