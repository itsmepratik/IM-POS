import { describe, it, expect } from "vitest";
import {
  enrichOpenedShiftForPOS,
  getShiftDisplayName,
  getDrawerBalance,
  shouldShowShiftLock,
  createShiftRefreshGuard,
} from "./cash-shift-display";

/**
 * TDD RED: POS must show cashier name + drawer balance the instant a shift
 * is opened — no reload / no second poll roundtrip.
 *
 * Root causes under test:
 * 1. openCashShift returns the raw cash_shifts row (no openedByStaffName,
 *    no currentCashInDrawer) so the header renders "Active" / 0.000.
 * 2. client-page refresh guard (isRefreshingRef) is never reset, so the
 *    re-fetch after onShiftOpened is swallowed and only a reload fixes it.
 */

const baseRawShift = {
  id: "shift-1",
  shopId: "shop-1",
  locationId: "loc-1",
  openedByStaffId: "staff-uuid-1",
  status: "open",
  startTime: new Date("2026-09-14T08:00:00.000Z"),
  openingCash: "150.500",
  openingDenominations: null,
  openingNotes: null,
};

describe("enrichOpenedShiftForPOS - instant POS update on shift open", () => {
  it("sets cashier name and drawer balance from opening float immediately", () => {
    const enriched = enrichOpenedShiftForPOS(baseRawShift, {
      staffName: "Ahmed Al-Busaidi",
      staffCode: "0007",
      shopName: "Saniya1",
    });

    expect(enriched.openedByStaffName).toBe("Ahmed Al-Busaidi");
    expect(enriched.openedByStaffCode).toBe("0007");
    expect(enriched.shopName).toBe("Saniya1");
    expect(enriched.currentCashInDrawer).toBeCloseTo(150.5, 3);
  });

  it("initialises live totals to zero for a freshly opened shift", () => {
    const enriched = enrichOpenedShiftForPOS(baseRawShift, {
      staffName: "Ahmed",
    });

    expect(enriched.calculatedCashSales).toBe(0);
    expect(enriched.calculatedTransactionCount).toBe(0);
    expect(enriched.totalCashIn).toBe(0);
    expect(enriched.totalCashOut).toBe(0);
    expect(enriched.movements).toEqual([]);
  });

  it("does not overwrite already-calculated live totals (idempotent)", () => {
    const withTotals = {
      ...baseRawShift,
      currentCashInDrawer: 175.25,
      calculatedCashSales: 24.75,
    };
    const enriched = enrichOpenedShiftForPOS(withTotals, {
      staffName: "Ahmed",
    });

    expect(enriched.currentCashInDrawer).toBeCloseTo(175.25, 3);
    expect(enriched.calculatedCashSales).toBeCloseTo(24.75, 3);
  });

  it("handles numeric openingCash values, not just numeric strings", () => {
    const enriched = enrichOpenedShiftForPOS(
      { ...baseRawShift, openingCash: 200 },
      { staffName: "Sara" },
    );
    expect(enriched.currentCashInDrawer).toBeCloseTo(200, 3);
  });
});

describe("getShiftDisplayName / getDrawerBalance - resilient header rendering", () => {
  it("prefers the cashier name, falls back to Active only when unknown", () => {
    expect(getShiftDisplayName({ openedByStaffName: "Ahmed" })).toBe("Ahmed");
    expect(getShiftDisplayName({})).toBe("Active");
    expect(getShiftDisplayName({ openedByStaffName: "" })).toBe("Active");
    expect(getShiftDisplayName(null)).toBe("Active");
  });

  it("falls back to openingCash when currentCashInDrawer is missing (raw open result)", () => {
    // This is the exact reload bug: raw openCashShift row has no
    // currentCashInDrawer, so the header showed 0.000 until a refetch.
    expect(getDrawerBalance({ openingCash: "150.500" })).toBeCloseTo(150.5, 3);
    expect(
      getDrawerBalance({ currentCashInDrawer: 175.25, openingCash: "150.500" }),
    ).toBeCloseTo(175.25, 3);
    expect(getDrawerBalance({})).toBe(0);
    expect(getDrawerBalance(null)).toBe(0);
  });
});

describe("shouldShowShiftLock - overlay hides the instant a shift exists", () => {
  it("hides the lock as soon as a shift object exists (no reload)", () => {
    expect(
      shouldShowShiftLock({
        activeShift: { id: "shift-1" },
        isLoadingShift: false,
        isLoadingBranches: false,
        shiftCheckFailed: false,
      }),
    ).toBe(false);
  });

  it("shows the lock only when the check succeeded and no shift was found", () => {
    expect(
      shouldShowShiftLock({
        activeShift: null,
        isLoadingShift: false,
        isLoadingBranches: false,
        shiftCheckFailed: false,
      }),
    ).toBe(true);
  });

  it("never locks while loading or when the check failed (DB unreachable)", () => {
    expect(
      shouldShowShiftLock({
        activeShift: null,
        isLoadingShift: true,
        isLoadingBranches: false,
        shiftCheckFailed: false,
      }),
    ).toBe(false);
    expect(
      shouldShowShiftLock({
        activeShift: null,
        isLoadingShift: false,
        isLoadingBranches: true,
        shiftCheckFailed: false,
      }),
    ).toBe(false);
    expect(
      shouldShowShiftLock({
        activeShift: null,
        isLoadingShift: false,
        isLoadingBranches: false,
        shiftCheckFailed: true,
      }),
    ).toBe(false);
  });
});

describe("createShiftRefreshGuard - consecutive refreshes must not be swallowed", () => {
  it("allows a second refresh after the first one releases (reload-bug regression)", () => {
    const guard = createShiftRefreshGuard();
    expect(guard.tryAcquire()).toBe(true);
    guard.release();
    // Before the fix isRefreshingRef was never reset, so this second
    // acquire (the onShiftOpened re-fetch / 15s poll) returned false
    // forever and the POS needed a full reload.
    expect(guard.tryAcquire()).toBe(true);
    guard.release();
  });

  it("blocks concurrent refreshes while one is in flight", () => {
    const guard = createShiftRefreshGuard();
    expect(guard.tryAcquire()).toBe(true);
    expect(guard.tryAcquire()).toBe(false);
    expect(guard.isRefreshing()).toBe(true);
    guard.release();
    expect(guard.isRefreshing()).toBe(false);
  });
});
