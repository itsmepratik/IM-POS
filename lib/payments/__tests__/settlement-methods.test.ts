import { describe, it, expect } from "vitest";
import {
  SETTLEMENT_METHODS,
  SETTLEMENT_METHOD_VALUES,
  isAllowedSettlementMethod,
  getSettlementMethodLabel,
  normalizeSettlementMethod,
  getMobilePayRecipients,
  SettlementRequestSchema,
} from "../methods";

/**
 * Credit settlement offers exactly Cash, Card, and Mobile Pay —
 * the same Mobile Pay + recipient model as the POS checkout.
 * - CREDIT / ON_HOLD / SPLIT can never settle a credit (would loop).
 * - Mobile settlement requires a payment recipient (account).
 */
describe("SETTLEMENT_METHODS - credit settlement options", () => {
  it("exposes exactly cash, card, and mobile transfer", () => {
    expect(SETTLEMENT_METHOD_VALUES).toEqual(["CASH", "CARD", "MOBILE"]);
    expect(SETTLEMENT_METHODS).toHaveLength(3);
  });

  it("provides a label for every value", () => {
    for (const method of SETTLEMENT_METHOD_VALUES) {
      const label = getSettlementMethodLabel(method);
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("labels mobile exactly as the POS checkout does", () => {
    expect(getSettlementMethodLabel("MOBILE")).toBe("Mobile Pay");
    expect(
      SETTLEMENT_METHODS.find((option) => option.value === "MOBILE")?.label,
    ).toBe("Mobile Pay");
  });

  it("labels cash and card distinctly", () => {
    expect(getSettlementMethodLabel("CASH").toLowerCase()).toContain("cash");
    expect(getSettlementMethodLabel("CARD").toLowerCase()).toContain("card");
  });
});

describe("isAllowedSettlementMethod", () => {
  it("allows cash, card, mobile in any casing", () => {
    expect(isAllowedSettlementMethod("CASH")).toBe(true);
    expect(isAllowedSettlementMethod("CARD")).toBe(true);
    expect(isAllowedSettlementMethod("MOBILE")).toBe(true);
    expect(isAllowedSettlementMethod("cash")).toBe(true);
    expect(isAllowedSettlementMethod("card")).toBe(true);
    expect(isAllowedSettlementMethod("mobile")).toBe(true);
  });

  it("rejects credit, on-hold, split, and empty values", () => {
    expect(isAllowedSettlementMethod("CREDIT")).toBe(false);
    expect(isAllowedSettlementMethod("ON_HOLD")).toBe(false);
    expect(isAllowedSettlementMethod("SPLIT")).toBe(false);
    expect(isAllowedSettlementMethod("")).toBe(false);
    expect(isAllowedSettlementMethod(null)).toBe(false);
    expect(isAllowedSettlementMethod(undefined)).toBe(false);
  });
});

describe("normalizeSettlementMethod", () => {
  it("normalizes to uppercase canonical values", () => {
    expect(normalizeSettlementMethod("cash")).toBe("CASH");
    expect(normalizeSettlementMethod("Card")).toBe("CARD");
    expect(normalizeSettlementMethod("mobile")).toBe("MOBILE");
  });

  it("returns null for disallowed methods", () => {
    expect(normalizeSettlementMethod("CREDIT")).toBeNull();
    expect(normalizeSettlementMethod("")).toBeNull();
    expect(normalizeSettlementMethod(null)).toBeNull();
  });
});

describe("getMobilePayRecipients - same recipients as POS checkout", () => {
  const staff = [
    { id: "0001", name: "Cashier One" },
    { id: "0010", name: "Adanan" },
    { id: "0020", name: "Forman" },
    { id: "0007", name: "Other Staff" },
  ];

  it("returns only the two mobile-money accounts", () => {
    const recipients = getMobilePayRecipients(staff);
    expect(recipients.map((recipient) => recipient.id).sort()).toEqual([
      "0010",
      "0020",
    ]);
  });

  it("labels 0010 as Foreman, exactly like the POS checkout", () => {
    const recipients = getMobilePayRecipients(staff);
    expect(
      recipients.find((recipient) => recipient.id === "0010")?.label,
    ).toBe("Foreman");
    expect(
      recipients.find((recipient) => recipient.id === "0020")?.label,
    ).toBe("Forman");
  });

  it("returns an empty list when no mobile accounts exist", () => {
    expect(getMobilePayRecipients([{ id: "0001", name: "Cashier" }])).toEqual(
      [],
    );
  });
});

describe("SettlementRequestSchema - mobile requires a recipient", () => {
  it("accepts cash without an account and defaults a missing method", () => {
    const parsed = SettlementRequestSchema.safeParse({
      referenceNumber: "A011230926",
      cashierId: "0001",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.paymentMethod).toBe("CASH");
    }
  });

  it("accepts mobile with a recipient account", () => {
    const parsed = SettlementRequestSchema.safeParse({
      referenceNumber: "A011230926",
      cashierId: "0001",
      paymentMethod: "MOBILE",
      mobilePaymentAccount: "Foreman",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects mobile without a recipient account", () => {
    expect(
      SettlementRequestSchema.safeParse({
        referenceNumber: "A011230926",
        cashierId: "0001",
        paymentMethod: "MOBILE",
      }).success,
    ).toBe(false);
    expect(
      SettlementRequestSchema.safeParse({
        referenceNumber: "A011230926",
        cashierId: "0001",
        paymentMethod: "MOBILE",
        mobilePaymentAccount: "   ",
      }).success,
    ).toBe(false);
  });

  it("rejects credit, on-hold, and split settlement methods", () => {
    for (const paymentMethod of ["CREDIT", "ON_HOLD", "SPLIT"]) {
      expect(
        SettlementRequestSchema.safeParse({
          referenceNumber: "A011230926",
          cashierId: "0001",
          paymentMethod,
        }).success,
      ).toBe(false);
    }
  });
});
