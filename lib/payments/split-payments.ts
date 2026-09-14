/**
 * Split cash/card payment domain logic.
 *
 * Single source of truth for encoding a split tender into the existing
 * `transactions.payment_method` TEXT column (no migration required).
 *
 * Format: `SPLIT_CASH_<cash.toFixed(3)>_CARD_<card.toFixed(3)>`
 * Example: `SPLIT_CASH_4.000_CARD_2.500`
 *
 * OMR uses 3-decimal precision throughout. All comparisons use
 * SPLIT_TOLERANCE to absorb binary float artefacts (0.1 + 0.2).
 */

export const SPLIT_TOLERANCE = 0.001;

export interface SplitPaymentInput {
  cashAmount: number;
  cardAmount: number;
  total: number;
}

export interface SplitValidationResult {
  valid: boolean;
  errors: string[];
  remaining: number;
  cashAmount: number;
  cardAmount: number;
  total: number;
}

export interface SplitLegs {
  cashAmount: number;
  cardAmount: number;
}

export interface DrawerAllocation {
  cash: number;
  card: number;
}

function isFiniteNumber(value: number): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

/** Round to OMR 3-decimal precision. Non-finite input maps to 0. */
export function roundOMR(value: number): number {
  if (!isFiniteNumber(value)) return 0;
  const rounded: number = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** Validate that cash + card exactly covers total (both legs > 0). */
export function validateSplitPayment(
  input: SplitPaymentInput,
): SplitValidationResult {
  const errors: string[] = [];
  const { cashAmount, cardAmount, total } = input;

  if (!isFiniteNumber(cashAmount)) errors.push("Cash amount must be a number.");
  if (!isFiniteNumber(cardAmount)) errors.push("Card amount must be a number.");
  if (!isFiniteNumber(total)) errors.push("Total must be a number.");

  const cash: number = isFiniteNumber(cashAmount) ? roundOMR(cashAmount) : 0;
  const card: number = isFiniteNumber(cardAmount) ? roundOMR(cardAmount) : 0;
  const normTotal: number = isFiniteNumber(total) ? roundOMR(total) : 0;

  if (errors.length === 0) {
    if (normTotal <= 0) errors.push("Total must be greater than zero.");
    if (cash <= 0) errors.push("Cash amount must be greater than zero.");
    if (card <= 0) errors.push("Card amount must be greater than zero.");
  }

  const remaining: number = roundOMR(normTotal - cash - card);

  if (errors.length === 0 && Math.abs(remaining) > SPLIT_TOLERANCE) {
    if (remaining > 0) {
      errors.push(
        `Split is short by OMR ${remaining.toFixed(3)}. Cash + card must equal the total.`,
      );
    } else {
      errors.push(
        `Split exceeds the total by OMR ${Math.abs(remaining).toFixed(3)}. Cash + card must equal the total.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    remaining,
    cashAmount: cash,
    cardAmount: card,
    total: normTotal,
  };
}

/** Derive the card leg from total - cash. */
export function calculateCardRemainder(
  total: number,
  cashAmount: number,
): number {
  return roundOMR(roundOMR(total) - roundOMR(cashAmount));
}

/** Derive the cash leg from total - card. */
export function calculateCashRemainder(
  total: number,
  cardAmount: number,
): number {
  return roundOMR(roundOMR(total) - roundOMR(cardAmount));
}

/** Encode legs into the persisted payment_method string. */
export function encodeSplitPaymentMethod(
  cashAmount: number,
  cardAmount: number,
): string {
  const cash: number = roundOMR(cashAmount);
  const card: number = roundOMR(cardAmount);
  return `SPLIT_CASH_${cash.toFixed(3)}_CARD_${card.toFixed(3)}`;
}

const SPLIT_WITH_LEGS_PATTERN =
  /^SPLIT_CASH_(-?\d+(?:\.\d+)?)_CARD_(-?\d+(?:\.\d+)?)$/i;

/**
 * Parse an encoded split string. Returns null for single-method values,
 * nullish input, and malformed SPLIT strings. A bare "SPLIT" (no legs)
 * parses to zero legs so callers can still detect split intent via
 * isSplitPaymentMethod and fall back safely in allocateSplitForDrawer.
 */
export function parseSplitPaymentMethod(
  method: string | null | undefined,
): SplitLegs | null {
  if (typeof method !== "string") return null;
  const trimmed: string = method.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.toUpperCase() === "SPLIT") {
    return { cashAmount: 0, cardAmount: 0 };
  }
  const match: RegExpMatchArray | null = trimmed.match(
    SPLIT_WITH_LEGS_PATTERN,
  );
  if (!match) return null;
  const cash: number = Number(match[1]);
  const card: number = Number(match[2]);
  if (!isFiniteNumber(cash) || !isFiniteNumber(card)) return null;
  return { cashAmount: roundOMR(cash), cardAmount: roundOMR(card) };
}

/** True for "SPLIT" and any "SPLIT_..." encoded value. */
export function isSplitPaymentMethod(
  method: string | null | undefined,
): boolean {
  if (typeof method !== "string") return false;
  return method.trim().toUpperCase().startsWith("SPLIT");
}

/**
 * Allocate a stored split to drawer buckets. When the encoded legs match
 * the stored total they are used verbatim; when the total drifted
 * (refund sign, rounding) the legs are scaled proportionally so
 * cash + card always equals the stored total.
 */
export function allocateSplitForDrawer(
  method: string | null | undefined,
  totalAmount: number,
): DrawerAllocation {
  if (!isSplitPaymentMethod(method)) return { cash: 0, card: 0 };
  const parsed: SplitLegs | null = parseSplitPaymentMethod(method);
  const total: number = roundOMR(totalAmount);
  if (!isFiniteNumber(total)) return { cash: 0, card: 0 };
  if (!parsed) return { cash: 0, card: 0 };
  const legsSum: number = roundOMR(parsed.cashAmount + parsed.cardAmount);
  if (legsSum <= 0) return { cash: 0, card: 0 };
  if (Math.abs(legsSum - total) <= SPLIT_TOLERANCE) {
    return { cash: parsed.cashAmount, card: parsed.cardAmount };
  }
  const ratio: number = total / legsSum;
  const cash: number = roundOMR(parsed.cashAmount * ratio);
  const card: number = roundOMR(total - cash);
  return { cash, card };
}

/** Human-readable receipt label, e.g. "Split (Cash OMR 4.000 + Card OMR 2.500)". */
export function formatSplitLabel(
  cashAmount: number,
  cardAmount: number,
): string {
  const cash: number = roundOMR(cashAmount);
  const card: number = roundOMR(cardAmount);
  return `Split (Cash OMR ${cash.toFixed(3)} + Card OMR ${card.toFixed(3)})`;
}
