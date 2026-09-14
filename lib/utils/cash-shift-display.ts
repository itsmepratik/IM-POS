/**
 * Cash shift POS display helpers.
 *
 * Client-safe pure module (type-only schema import, erased at build) so
 * both the `openCashShift` server action and the POS client components
 * share one source of truth for "show cashier name + drawer balance
 * instantly, without a reload".
 */

import type { CashShiftMovement } from "@/lib/db/schema";

export interface OpenedShiftEnrichmentContext {
  staffName?: string | null;
  staffCode?: string | null;
  shopName?: string | null;
  locationName?: string | null;
}

export interface EnrichedShiftFields {
  openedByStaffName?: string;
  openedByStaffCode?: string;
  shopName?: string;
  locationName?: string;
  currentCashInDrawer: number;
  calculatedCashSales: number;
  calculatedCardSales: number;
  calculatedMobileSales: number;
  calculatedCreditSales: number;
  calculatedRefunds: number;
  calculatedTransactionCount: number;
  totalCashIn: number;
  totalCashOut: number;
  movements: CashShiftMovement[];
}

export interface ShiftLockState {
  activeShift: unknown;
  isLoadingShift: boolean;
  isLoadingBranches: boolean;
  shiftCheckFailed: boolean;
}

export interface ShiftRefreshGuard {
  tryAcquire: () => boolean;
  release: () => void;
  isRefreshing: () => boolean;
}

function parseNumeric(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed: number = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function roundTo3(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(3));
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed: string = value.trim();
  return trimmed.length > 0 ? value : undefined;
}

function numericField(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed: number = parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Build the full POS-ready shift object the instant a shift is opened.
 * Preserves any already-calculated live totals (idempotent) and fills
 * opening-float-derived defaults otherwise — so the header never flashes
 * "Active" / 0.000 while waiting for a refetch.
 */
export function enrichOpenedShiftForPOS<T extends object>(
  rawShift: T,
  context: OpenedShiftEnrichmentContext,
): T & EnrichedShiftFields {
  const record: Record<string, unknown> = rawShift as Record<string, unknown>;
  const openingCash: number = roundTo3(parseNumeric(record["openingCash"]));

  const existingDrawer: unknown = record["currentCashInDrawer"];
  const currentCashInDrawer: number =
    typeof existingDrawer === "number" && Number.isFinite(existingDrawer)
      ? existingDrawer
      : openingCash;

  const resolvedName: string | undefined =
    nonEmptyString(record["openedByStaffName"]) ??
    nonEmptyString(context.staffName);
  const resolvedCode: string | undefined =
    nonEmptyString(record["openedByStaffCode"]) ??
    nonEmptyString(context.staffCode);
  const resolvedShop: string | undefined =
    nonEmptyString(record["shopName"]) ?? nonEmptyString(context.shopName);
  const resolvedLocation: string | undefined =
    nonEmptyString(record["locationName"]) ??
    nonEmptyString(context.locationName);

  const existingMovements: unknown = record["movements"];
  const movements: CashShiftMovement[] = Array.isArray(existingMovements)
    ? (existingMovements as CashShiftMovement[])
    : [];

  const enriched: EnrichedShiftFields = {
    currentCashInDrawer,
    calculatedCashSales: numericField(record["calculatedCashSales"], 0),
    calculatedCardSales: numericField(record["calculatedCardSales"], 0),
    calculatedMobileSales: numericField(record["calculatedMobileSales"], 0),
    calculatedCreditSales: numericField(record["calculatedCreditSales"], 0),
    calculatedRefunds: numericField(record["calculatedRefunds"], 0),
    calculatedTransactionCount: Math.trunc(
      numericField(record["calculatedTransactionCount"], 0),
    ),
    totalCashIn: numericField(record["totalCashIn"], 0),
    totalCashOut: numericField(record["totalCashOut"], 0),
    movements,
  };
  if (resolvedName !== undefined) enriched.openedByStaffName = resolvedName;
  if (resolvedCode !== undefined) enriched.openedByStaffCode = resolvedCode;
  if (resolvedShop !== undefined) enriched.shopName = resolvedShop;
  if (resolvedLocation !== undefined)
    enriched.locationName = resolvedLocation;

  return { ...rawShift, ...enriched };
}

/** Header cashier label — never blank, never flashes wrong during open. */
export function getShiftDisplayName(shift: unknown): string {
  if (isRecord(shift)) {
    const name: string | undefined = nonEmptyString(
      shift["openedByStaffName"],
    );
    if (name !== undefined) return name;
  }
  return "Active";
}

/**
 * Header drawer balance. Falls back to openingCash so a raw
 * just-opened row (no currentCashInDrawer yet) still shows the
 * correct float instead of 0.000.
 */
export function getDrawerBalance(shift: unknown): number {
  if (!isRecord(shift)) return 0;
  const live: unknown = shift["currentCashInDrawer"];
  if (typeof live === "number" && Number.isFinite(live)) return live;
  if (typeof live === "string") {
    const parsed: number = parseFloat(live);
    if (Number.isFinite(parsed)) return parsed;
  }
  return roundTo3(parseNumeric(shift["openingCash"]));
}

/**
 * Single source of truth for the POS lock overlay visibility.
 * Mirrors the client-page contract: lock only when the branch is known,
 * loading is done, the check succeeded, and no shift exists.
 */
export function shouldShowShiftLock(state: ShiftLockState): boolean {
  if (state.activeShift) return false;
  if (state.isLoadingShift) return false;
  if (state.isLoadingBranches) return false;
  if (state.shiftCheckFailed) return false;
  return true;
}

/**
 * Extracted refresh mutual-exclusion guard. The previous inline
 * isRefreshingRef was set but never released, swallowing every
 * refresh after the first (including the post-open re-fetch) and
 * forcing a full reload to see the new shift.
 */
export function createShiftRefreshGuard(): ShiftRefreshGuard {
  let refreshing: boolean = false;
  const tryAcquire = (): boolean => {
    if (refreshing) return false;
    refreshing = true;
    return true;
  };
  const release = (): void => {
    refreshing = false;
  };
  const isRefreshing = (): boolean => refreshing;
  return { tryAcquire, release, isRefreshing };
}
