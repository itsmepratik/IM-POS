import { DenominationBreakdown } from "@/lib/db/schema";

/**
 * Calculates sum from denomination breakdown in OMR
 */
export function calculateDenominationsTotal(denom?: DenominationBreakdown | null): number {
  if (!denom) return 0;
  const fifty = (Number(denom.fiftyNote) || 0) * 50;
  const twenty = (Number(denom.twentyNote) || 0) * 20;
  const ten = (Number(denom.tenNote) || 0) * 10;
  const five = (Number(denom.fiveNote) || 0) * 5;
  const one = (Number(denom.oneNote) || 0) * 1;
  const half = (Number(denom.halfNote) || 0) * 0.5;
  const hundredBaisa = (Number(denom.hundredBaisa) || 0) * 0.1;
  const coins = Number(denom.coins) || 0;

  const total = fifty + twenty + ten + five + one + half + hundredBaisa + coins;
  return Number(total.toFixed(3));
}
