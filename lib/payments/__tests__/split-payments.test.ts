import { describe, it, expect } from "vitest";
import {
  validateSplitPayment,
  calculateCardRemainder,
  calculateCashRemainder,
  encodeSplitPaymentMethod,
  parseSplitPaymentMethod,
  isSplitPaymentMethod,
  allocateSplitForDrawer,
  formatSplitLabel,
  roundOMR,
  SPLIT_TOLERANCE,
} from "../split-payments";

/**
 * TDD RED — split cash/card payments.
 *
 * Contract under test (lib/payments/split-payments.ts does not exist yet):
 * - OMR uses 3-decimal precision; float artefacts (0.1 + 0.2) must not
 *   break validation.
 * - A valid split requires cash > 0, card > 0, and cash + card == total
 *   within SPLIT_TOLERANCE.
 * - The encoded payment_method string is the single source of truth
 *   persisted to transactions.payment_method (text column, no migration).
 * - Drawer allocation must parse the encoded string so cash/card shift
 *   totals stay correct.
 */
describe("roundOMR - OMR 3-decimal precision", () => {
  it("rounds to 3 decimals", () => {
    expect(roundOMR(6.5)).toBe(6.5);
    expect(roundOMR(6.1239)).toBe(6.124);
    expect(roundOMR(6.1234)).toBe(6.123);
  });

  it("absorbs binary float artefacts", () => {
    expect(roundOMR(0.1 + 0.2)).toBe(0.3);
  });

  it("rejects non-finite input", () => {
    expect(roundOMR(NaN)).toBe(0);
    expect(roundOMR(Infinity)).toBe(0);
  });
});

describe("validateSplitPayment - cash/card split must equal total", () => {
  it("accepts an exact split", () => {
    const result = validateSplitPayment({
      cashAmount: 4.0,
      cardAmount: 2.5,
      total: 6.5,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.remaining).toBeCloseTo(0, 3);
  });

  it("accepts float-artefact splits within tolerance", () => {
    const result = validateSplitPayment({
      cashAmount: 0.1,
      cardAmount: 0.2,
      total: 0.3,
    });
    expect(result.valid).toBe(true);
  });

  it("rejects when cash + card does not equal total", () => {
    const result = validateSplitPayment({
      cashAmount: 4.0,
      cardAmount: 2.0,
      total: 6.5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.remaining).toBeCloseTo(0.5, 3);
  });

  it("rejects a split with a zero leg (use single method instead)", () => {
    const zeroCard = validateSplitPayment({
      cashAmount: 6.5,
      cardAmount: 0,
      total: 6.5,
    });
    expect(zeroCard.valid).toBe(false);

    const zeroCash = validateSplitPayment({
      cashAmount: 0,
      cardAmount: 6.5,
      total: 6.5,
    });
    expect(zeroCash.valid).toBe(false);
  });

  it("rejects negative legs", () => {
    const result = validateSplitPayment({
      cashAmount: -1,
      cardAmount: 7.5,
      total: 6.5,
    });
    expect(result.valid).toBe(false);
  });

  it("rejects non-finite legs", () => {
    const result = validateSplitPayment({
      cashAmount: NaN,
      cardAmount: 6.5,
      total: 6.5,
    });
    expect(result.valid).toBe(false);
  });

  it("rejects overpayment", () => {
    const result = validateSplitPayment({
      cashAmount: 5.0,
      cardAmount: 5.0,
      total: 6.5,
    });
    expect(result.valid).toBe(false);
    expect(result.remaining).toBeLessThan(0);
  });

  it("exposes SPLIT_TOLERANCE for callers", () => {
    expect(SPLIT_TOLERANCE).toBeLessThanOrEqual(0.002);
  });
});

describe("calculateCardRemainder / calculateCashRemainder", () => {
  it("derives the card leg from total - cash", () => {
    expect(calculateCardRemainder(6.5, 4.0)).toBeCloseTo(2.5, 3);
  });

  it("derives the cash leg from total - card", () => {
    expect(calculateCashRemainder(6.5, 2.5)).toBeCloseTo(4.0, 3);
  });

  it("clamps float artefacts to 3 decimals", () => {
    expect(calculateCardRemainder(0.3, 0.1)).toBeCloseTo(0.2, 3);
  });
});

describe("encodeSplitPaymentMethod / parseSplitPaymentMethod", () => {
  it("encodes a deterministic, parseable method string", () => {
    const encoded = encodeSplitPaymentMethod(4.0, 2.5);
    expect(typeof encoded).toBe("string");
    expect(encoded.startsWith("SPLIT")).toBe(true);
    expect(encoded).toContain("CASH");
    expect(encoded).toContain("CARD");
  });

  it("round-trips through the parser", () => {
    const encoded = encodeSplitPaymentMethod(4.0, 2.5);
    const parsed = parseSplitPaymentMethod(encoded);
    expect(parsed).not.toBeNull();
    expect(parsed?.cashAmount).toBeCloseTo(4.0, 3);
    expect(parsed?.cardAmount).toBeCloseTo(2.5, 3);
  });

  it("returns null for single-method strings and nullish input", () => {
    expect(parseSplitPaymentMethod("CASH")).toBeNull();
    expect(parseSplitPaymentMethod("CARD")).toBeNull();
    expect(parseSplitPaymentMethod("MOBILE")).toBeNull();
    expect(parseSplitPaymentMethod(null)).toBeNull();
    expect(parseSplitPaymentMethod(undefined)).toBeNull();
    expect(parseSplitPaymentMethod("")).toBeNull();
  });

  it("returns null for malformed SPLIT strings", () => {
    expect(parseSplitPaymentMethod("SPLIT_GARBAGE")).toBeNull();
  });

  it("is case-insensitive on parse", () => {
    const encoded = encodeSplitPaymentMethod(1.5, 5.0);
    expect(parseSplitPaymentMethod(encoded.toLowerCase())).not.toBeNull();
  });
});

describe("isSplitPaymentMethod", () => {
  it("detects split vs single methods", () => {
    expect(isSplitPaymentMethod(encodeSplitPaymentMethod(1, 2))).toBe(true);
    expect(isSplitPaymentMethod("CASH")).toBe(false);
    expect(isSplitPaymentMethod("CARD")).toBe(false);
    expect(isSplitPaymentMethod("SPLIT")).toBe(true);
    expect(isSplitPaymentMethod(null)).toBe(false);
    expect(isSplitPaymentMethod(undefined)).toBe(false);
  });
});

describe("allocateSplitForDrawer - shift totals must stay correct", () => {
  it("allocates parsed legs when they match the total", () => {
    const method = encodeSplitPaymentMethod(4.0, 2.5);
    const allocation = allocateSplitForDrawer(method, 6.5);
    expect(allocation.cash).toBeCloseTo(4.0, 3);
    expect(allocation.card).toBeCloseTo(2.5, 3);
  });

  it("scales proportionally when the stored total drifted (refunds/rounding)", () => {
    const method = encodeSplitPaymentMethod(4.0, 2.0); // 6.0 encoded
    const allocation = allocateSplitForDrawer(method, 12.0); // 2x total
    expect(allocation.cash + allocation.card).toBeCloseTo(12.0, 3);
    expect(allocation.cash).toBeCloseTo(8.0, 3);
    expect(allocation.card).toBeCloseTo(4.0, 3);
  });

  it("falls back to zero allocation for non-split methods", () => {
    expect(allocateSplitForDrawer("CASH", 6.5)).toEqual({
      cash: 0,
      card: 0,
    });
  });
});

describe("formatSplitLabel", () => {
  it("produces a human-readable receipt label", () => {
    const label = formatSplitLabel(4.0, 2.5);
    expect(label).toContain("Cash");
    expect(label).toContain("Card");
    expect(label).toContain("4.000");
    expect(label).toContain("2.500");
  });
});
