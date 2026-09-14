/**
 * Canonical payment method catalogs.
 *
 * Checkout shows every method directly — no "Other" gate. Credit
 * settlement offers exactly Cash, Card, and Mobile Pay, with the same
 * mobile-money recipients as the POS checkout.
 */
import { z } from "zod";
import {
  formatSplitLabel,
  parseSplitPaymentMethod,
} from "./split-payments";

export const SETTLEMENT_METHOD_VALUES = ["CASH", "CARD", "MOBILE"] as const;

export type SettlementMethod = (typeof SETTLEMENT_METHOD_VALUES)[number];

export interface SettlementMethodOption {
  value: SettlementMethod;
  label: string;
}

export const SETTLEMENT_METHODS: readonly SettlementMethodOption[] = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "MOBILE", label: "Mobile Pay" },
] as const;

const SETTLEMENT_LABELS: Record<SettlementMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  MOBILE: "Mobile Pay",
};

function toCanonicalUpper(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed: string = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.toUpperCase();
}

/** True only for CASH / CARD / MOBILE (any casing). */
export function isAllowedSettlementMethod(
  value: unknown,
): value is SettlementMethod {
  const upper: string | null = toCanonicalUpper(value);
  if (upper === null) return false;
  return (SETTLEMENT_METHOD_VALUES as readonly string[]).includes(upper);
}

/** UI-ready label. Unknown values fall back to the raw string. */
export function getSettlementMethodLabel(value: string): string {
  const upper: string | null = toCanonicalUpper(value);
  if (upper !== null && upper in SETTLEMENT_LABELS) {
    return SETTLEMENT_LABELS[upper as SettlementMethod];
  }
  return value;
}

/** Normalize to CASH | CARD | MOBILE, or null when disallowed. */
export function normalizeSettlementMethod(
  value: unknown,
): SettlementMethod | null {
  const upper: string | null = toCanonicalUpper(value);
  if (upper === null) return null;
  if ((SETTLEMENT_METHOD_VALUES as readonly string[]).includes(upper)) {
    return upper as SettlementMethod;
  }
  return null;
}

export interface MobilePayRecipient {
  id: string;
  name: string;
  label: string;
}

/**
 * The mobile-money accounts accepted by Mobile Pay — identical to the
 * POS checkout (staff 0010 shown as "Foreman", 0020 by name).
 */
export function getMobilePayRecipients(
  staffMembers: Array<{ id: string; name: string }>,
): MobilePayRecipient[] {
  return staffMembers
    .filter((staff) => staff.id === "0020" || staff.id === "0010")
    .map((staff) => ({
      id: staff.id,
      name: staff.name,
      label: staff.id === "0010" ? "Foreman" : staff.name,
    }));
}

/**
 * Settlement request validation shared by the settle-transaction route
 * and its tests. Mobile settlement requires a recipient account,
 * mirroring the POS checkout (mobile cannot complete without one).
 */
export const SettlementRequestSchema = z
  .object({
    referenceNumber: z.string().min(1, "Reference number is required"),
    cashierId: z.string().min(1, "Cashier ID is required"),
    paymentMethod: z.enum(["CASH", "CARD", "MOBILE"]).default("CASH").optional(),
    mobilePaymentAccount: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.paymentMethod === "MOBILE" &&
      (!val.mobilePaymentAccount || val.mobilePaymentAccount.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A payment recipient is required for Mobile Pay settlement",
        path: ["mobilePaymentAccount"],
      });
    }
  });

export type SettlementRequest = z.infer<typeof SettlementRequestSchema>;

export const CHECKOUT_METHOD_VALUES = [
  "mobile",
  "cash",
  "card",
  "credit",
  "on-hold",
  "split",
] as const;

export type CheckoutMethod = (typeof CHECKOUT_METHOD_VALUES)[number];

export type LegacyCheckoutMethod = Exclude<CheckoutMethod, "split">;

export function formatPaymentMethodLabel(
  method: string | null | undefined,
): string {
  if (typeof method !== "string" || method.trim().length === 0) return "Cash";
  const trimmed: string = method.trim();
  if (
    trimmed.toUpperCase().startsWith("SPLIT") ||
    trimmed.toLowerCase() === "split"
  ) {
    const legs = parseSplitPaymentMethod(trimmed);
    if (legs && (legs.cashAmount > 0 || legs.cardAmount > 0)) {
      return formatSplitLabel(legs.cashAmount, legs.cardAmount);
    }
    return "Split (Cash + Card)";
  }
  switch (trimmed.toLowerCase()) {
    case "card":
      return "Card";
    case "cash":
      return "Cash";
    case "mobile":
      return "Mobile Pay";
    case "on-hold":
      return "on-hold";
    case "credit":
      return "Credit";
    default:
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
}
