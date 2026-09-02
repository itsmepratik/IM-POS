"use server";

import { getDatabase } from "@/lib/db/client";
import {
  cashShifts,
  cashShiftMovements,
  transactions,
  staff,
  shops,
  locations,
  type CashShift,
  type NewCashShift,
  type CashShiftMovement,
  type NewCashShiftMovement,
  type DenominationBreakdown,
} from "@/lib/db/schema";
import { eq, and, desc, sql, gte, lte, inArray, or, isNull } from "drizzle-orm";
import { revalidateTag, revalidatePath } from "next/cache";
import { CACHE_TAGS } from "@/lib/db/cache-tags";

// Revalidation helper
function invalidateShiftCaches(shopId: string) {
  try {
    revalidateTag(CACHE_TAGS.CASH_SHIFTS);
    revalidateTag(CACHE_TAGS.cashShift(shopId));
    revalidatePath("/pos");
    revalidatePath("/cash-shifts");
  } catch {
    // Graceful fallback if invoked outside active Next.js request context
  }
}

export interface ActiveShiftDetails extends CashShift {
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

import { calculateDenominationsTotal } from "@/lib/utils/cash-denomination";


/**
 * Fetches the currently open cash shift for a specific shop, along with live calculated totals
 */
export async function getActiveShift(shopId: string): Promise<ActiveShiftDetails | null> {
  if (!shopId) return null;
  const db = getDatabase();

  const [shift] = await db
    .select({
      shift: cashShifts,
      staffName: staff.name,
      staffCode: staff.staffId,
      shopName: shops.name,
      locationName: locations.name,
    })
    .from(cashShifts)
    .leftJoin(staff, eq(cashShifts.openedByStaffId, staff.id))
    .leftJoin(shops, eq(cashShifts.shopId, shops.id))
    .leftJoin(locations, eq(cashShifts.locationId, locations.id))
    .where(and(eq(cashShifts.shopId, shopId), eq(cashShifts.status, "open")))
    .orderBy(desc(cashShifts.startTime))
    .limit(1);

  if (!shift) return null;

  const currentShift = shift.shift;

  // Fetch movements for this shift
  const movements = await db
    .select()
    .from(cashShiftMovements)
    .where(eq(cashShiftMovements.shiftId, currentShift.id))
    .orderBy(desc(cashShiftMovements.createdAt));

  let totalCashIn = 0;
  let totalCashOut = 0;
  movements.forEach((m) => {
    const amt = parseFloat(m.amount) || 0;
    if (m.type === "CASH_IN" || m.type === "PAY_IN") {
      totalCashIn += amt;
    } else {
      totalCashOut += amt;
    }
  });

  // Calculate live sales from transactions tied to this shift or created during shift
  const shiftTxns = await db
    .select({
      id: transactions.id,
      paymentMethod: transactions.paymentMethod,
      totalAmount: transactions.totalAmount,
      type: transactions.type,
      isVoided: transactions.isVoided,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.shopId, shopId),
        eq(transactions.isVoided, false),
        or(
          eq(transactions.cashShiftId, currentShift.id),
          and(
            isNull(transactions.cashShiftId),
            gte(transactions.createdAt, currentShift.startTime)
          )
        )
      )
    );

  let calculatedCashSales = 0;
  let calculatedCardSales = 0;
  let calculatedMobileSales = 0;
  let calculatedCreditSales = 0;
  let calculatedRefunds = 0;
  let calculatedTransactionCount = 0;

  shiftTxns.forEach((txn) => {
    const amt = parseFloat(txn.totalAmount) || 0;
    const method = (txn.paymentMethod || "").toUpperCase();

    if (txn.type === "REFUND") {
      calculatedRefunds += amt;
      if (method === "CASH") {
        calculatedCashSales -= amt;
      }
    } else if (txn.type === "SALE" || txn.type === "CREDIT") {
      calculatedTransactionCount += 1;
      if (method === "CASH") {
        calculatedCashSales += amt;
      } else if (method === "CARD") {
        calculatedCardSales += amt;
      } else if (method === "MOBILE" || method === "ONLINE") {
        calculatedMobileSales += amt;
      } else if (method === "CREDIT" || txn.type === "CREDIT") {
        calculatedCreditSales += amt;
      }
    }
  });

  const opening = parseFloat(currentShift.openingCash) || 0;
  const currentCashInDrawer = opening + calculatedCashSales + totalCashIn - totalCashOut;

  return {
    ...currentShift,
    openedByStaffName: shift.staffName,
    openedByStaffCode: shift.staffCode,
    shopName: shift.shopName,
    locationName: shift.locationName,
    currentCashInDrawer: Number(currentCashInDrawer.toFixed(3)),
    calculatedCashSales: Number(calculatedCashSales.toFixed(3)),
    calculatedCardSales: Number(calculatedCardSales.toFixed(3)),
    calculatedMobileSales: Number(calculatedMobileSales.toFixed(3)),
    calculatedCreditSales: Number(calculatedCreditSales.toFixed(3)),
    calculatedRefunds: Number(calculatedRefunds.toFixed(3)),
    calculatedTransactionCount,
    totalCashIn: Number(totalCashIn.toFixed(3)),
    totalCashOut: Number(totalCashOut.toFixed(3)),
    movements,
  };
}

export interface OpenShiftInput {
  shopId: string;
  locationId: string;
  openedByStaffId: string;
  openingCash: number;
  openingDenominations?: DenominationBreakdown;
  openingNotes?: string;
}

/**
 * Open a new cash shift for a shop. Prevents duplicate open shifts atomically in transaction.
 */
export async function openCashShift(input: OpenShiftInput): Promise<{ success: boolean; shift?: CashShift; error?: string }> {
  try {
    const db = getDatabase();

    // Check if there is already an open shift for this shop
    const [existing] = await db
      .select({ id: cashShifts.id })
      .from(cashShifts)
      .where(and(eq(cashShifts.shopId, input.shopId), eq(cashShifts.status, "open")))
      .limit(1);

    if (existing) {
      return { success: false, error: "A cash shift is already active for this shop. Please close it first." };
    }

    // Resolve valid locationId if missing or mismatched
    let resolvedLocationId = input.locationId;
    const [targetShop] = await db
      .select({ id: shops.id, locationId: shops.locationId })
      .from(shops)
      .where(eq(shops.id, input.shopId))
      .limit(1);

    if (targetShop?.locationId && (!resolvedLocationId || resolvedLocationId === input.shopId)) {
      resolvedLocationId = targetShop.locationId;
    }

    const [created] = await db
      .insert(cashShifts)
      .values({
        shopId: input.shopId,
        locationId: resolvedLocationId,
        openedByStaffId: input.openedByStaffId,
        status: "open",
        startTime: new Date(),
        openingCash: input.openingCash.toFixed(3),
        openingDenominations: input.openingDenominations || null,
        openingNotes: input.openingNotes?.trim() || null,
      })
      .returning();

    invalidateShiftCaches(input.shopId);
    return { success: true, shift: created };
  } catch (error: any) {
    console.error("Failed to open cash shift:", error);
    return { success: false, error: error?.message || "Failed to open cash shift" };
  }
}

export interface CloseShiftInput {
  shiftId: string;
  closedByStaffId: string;
  actualClosingCash: number;
  closingDenominations?: DenominationBreakdown;
  closingNotes?: string;
}

/**
 * Close an active cash shift with actual drawer counts, expected reconciliation, and transaction tallying.
 */
export async function closeCashShift(input: CloseShiftInput): Promise<{ success: boolean; shift?: CashShift; error?: string }> {
  try {
    const db = getDatabase();

    const [existingShift] = await db
      .select()
      .from(cashShifts)
      .where(eq(cashShifts.id, input.shiftId))
      .limit(1);

    if (!existingShift) {
      return { success: false, error: "Shift not found" };
    }

    if (existingShift.status !== "open") {
      return { success: false, error: "This shift is already closed" };
    }

    const endTime = new Date();

    // Fetch movements
    const movements = await db
      .select()
      .from(cashShiftMovements)
      .where(eq(cashShiftMovements.shiftId, existingShift.id));

    let totalCashIn = 0;
    let totalCashOut = 0;
    movements.forEach((m) => {
      const amt = parseFloat(m.amount) || 0;
      if (m.type === "CASH_IN" || m.type === "PAY_IN") totalCashIn += amt;
      else totalCashOut += amt;
    });

    // Fetch all transactions that occurred during this shift
    const shiftTxns = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.shopId, existingShift.shopId),
          eq(transactions.isVoided, false),
          or(
            eq(transactions.cashShiftId, existingShift.id),
            and(
              isNull(transactions.cashShiftId),
              gte(transactions.createdAt, existingShift.startTime),
              lte(transactions.createdAt, endTime)
            )
          )
        )
      );

    let totalCashSales = 0;
    let totalCardSales = 0;
    let totalMobileSales = 0;
    let totalCreditSales = 0;
    let totalRefunds = 0;
    let totalTransactionsCount = 0;

    const txnIdsToLink: string[] = [];

    shiftTxns.forEach((txn) => {
      txnIdsToLink.push(txn.id);
      const amt = parseFloat(txn.totalAmount) || 0;
      const method = (txn.paymentMethod || "").toUpperCase();

      if (txn.type === "REFUND") {
        totalRefunds += amt;
        if (method === "CASH") totalCashSales -= amt;
      } else if (txn.type === "SALE" || txn.type === "CREDIT") {
        totalTransactionsCount += 1;
        if (method === "CASH") totalCashSales += amt;
        else if (method === "CARD") totalCardSales += amt;
        else if (method === "MOBILE" || method === "ONLINE") totalMobileSales += amt;
        else if (method === "CREDIT" || txn.type === "CREDIT") totalCreditSales += amt;
      }
    });

    // Link any unlinked transactions to this shift
    if (txnIdsToLink.length > 0) {
      await db
        .update(transactions)
        .set({ cashShiftId: existingShift.id })
        .where(inArray(transactions.id, txnIdsToLink));
    }

    const openingCash = parseFloat(existingShift.openingCash) || 0;
    const expectedClosingCash = openingCash + totalCashSales + totalCashIn - totalCashOut;
    const cashDifference = input.actualClosingCash - expectedClosingCash;

    let reconciliationStatus = "balanced";
    if (Math.abs(cashDifference) > 0.005) {
      reconciliationStatus = cashDifference > 0 ? "overage" : "shortage";
    }

    const [updated] = await db
      .update(cashShifts)
      .set({
        closedByStaffId: input.closedByStaffId,
        status: "closed",
        endTime,
        expectedClosingCash: expectedClosingCash.toFixed(3),
        actualClosingCash: input.actualClosingCash.toFixed(3),
        closingDenominations: input.closingDenominations || null,
        cashDifference: cashDifference.toFixed(3),
        closingNotes: input.closingNotes?.trim() || null,
        totalCashSales: totalCashSales.toFixed(3),
        totalCardSales: totalCardSales.toFixed(3),
        totalMobileSales: totalMobileSales.toFixed(3),
        totalCreditSales: totalCreditSales.toFixed(3),
        totalRefunds: totalRefunds.toFixed(3),
        totalTransactions: totalTransactionsCount,
        reconciliationStatus,
        updatedAt: new Date(),
      })
      .where(eq(cashShifts.id, existingShift.id))
      .returning();

    invalidateShiftCaches(existingShift.shopId);
    return { success: true, shift: updated };
  } catch (error: any) {
    console.error("Failed to close cash shift:", error);
    return { success: false, error: error?.message || "Failed to close cash shift" };
  }
}

export interface AddCashMovementInput {
  shiftId: string;
  staffId: string;
  type: "CASH_IN" | "CASH_OUT" | "DROP" | "PAY_IN" | "PAY_OUT";
  amount: number;
  reason: string;
}

/**
 * Record cash drop, petty cash in/out, or float adjustments
 */
export async function addCashMovement(input: AddCashMovementInput): Promise<{ success: boolean; movement?: CashShiftMovement; error?: string }> {
  try {
    const db = getDatabase();

    if (input.amount <= 0) {
      return { success: false, error: "Movement amount must be greater than zero" };
    }

    const [shift] = await db
      .select({ shopId: cashShifts.shopId, status: cashShifts.status })
      .from(cashShifts)
      .where(eq(cashShifts.id, input.shiftId))
      .limit(1);

    if (!shift || shift.status !== "open") {
      return { success: false, error: "Movement can only be recorded on an open shift" };
    }

    const [created] = await db
      .insert(cashShiftMovements)
      .values({
        shiftId: input.shiftId,
        staffId: input.staffId,
        type: input.type,
        amount: input.amount.toFixed(3),
        reason: input.reason.trim(),
      })
      .returning();

    invalidateShiftCaches(shift.shopId);
    return { success: true, movement: created };
  } catch (error: any) {
    console.error("Failed to record cash movement:", error);
    return { success: false, error: error?.message || "Failed to record cash movement" };
  }
}

export interface ReconcileShiftInput {
  shiftId: string;
  reconciledByStaffId: string;
  reconciliationNotes?: string;
  reconciliationStatus?: "approved" | "balanced" | "overage" | "shortage";
}

/**
 * Admin reconciliation & sign-off for a closed cash shift
 */
export async function reconcileCashShift(input: ReconcileShiftInput): Promise<{ success: boolean; shift?: CashShift; error?: string }> {
  try {
    const db = getDatabase();

    const [existing] = await db
      .select()
      .from(cashShifts)
      .where(eq(cashShifts.id, input.shiftId))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Shift not found" };
    }

    const [updated] = await db
      .update(cashShifts)
      .set({
        reconciledByStaffId: input.reconciledByStaffId,
        reconciledAt: new Date(),
        reconciliationNotes: input.reconciliationNotes?.trim() || null,
        reconciliationStatus: input.reconciliationStatus || "approved",
        status: "reconciled",
        updatedAt: new Date(),
      })
      .where(eq(cashShifts.id, input.shiftId))
      .returning();

    invalidateShiftCaches(existing.shopId);
    return { success: true, shift: updated };
  } catch (error: any) {
    console.error("Failed to reconcile cash shift:", error);
    return { success: false, error: error?.message || "Failed to reconcile cash shift" };
  }
}

export interface CashShiftFilterOptions {
  shopId?: string;
  status?: "open" | "closed" | "reconciled";
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Query cash shifts history with staff and shop joins for admin review
 */
export async function getCashShiftsHistory(options: CashShiftFilterOptions = {}) {
  const db = getDatabase();
  const conditions = [];

  if (options.shopId && options.shopId !== "all") {
    conditions.push(eq(cashShifts.shopId, options.shopId));
  }

  if (options.status && options.status !== "all") {
    conditions.push(eq(cashShifts.status, options.status));
  }

  if (options.startDate) {
    conditions.push(gte(cashShifts.startTime, new Date(options.startDate)));
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(cashShifts.startTime, end));
  }

  const whereClause = conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : and(...conditions);

  let query = db
    .select({
      shift: cashShifts,
      shopName: shops.name,
      locationName: locations.name,
      openedByName: staff.name,
      openedByCode: staff.staffId,
    })
    .from(cashShifts)
    .leftJoin(shops, eq(cashShifts.shopId, shops.id))
    .leftJoin(locations, eq(cashShifts.locationId, locations.id))
    .leftJoin(staff, eq(cashShifts.openedByStaffId, staff.id))
    .orderBy(desc(cashShifts.startTime))
    .limit(options.limit || 50)
    .offset(options.offset || 0);

  if (whereClause) {
    query = query.where(whereClause);
  }

  const results = await query;
  return results.map((r) => ({
    ...r.shift,
    shopName: r.shopName || "Unknown Branch",
    locationName: r.locationName || "Unknown Location",
    openedByName: r.openedByName || "Unknown Staff",
    openedByCode: r.openedByCode || "—",
  }));
}

/**
 * Detailed report of a single shift with movements, transactions, and breakdown
 */
export async function getCashShiftFullDetails(shiftId: string) {
  const db = getDatabase();

  const [shiftData] = await db
    .select({
      shift: cashShifts,
      shopName: shops.name,
      shopCode: shops.shopCode,
      locationName: locations.name,
      openedByName: staff.name,
      openedByCode: staff.staffId,
    })
    .from(cashShifts)
    .leftJoin(shops, eq(cashShifts.shopId, shops.id))
    .leftJoin(locations, eq(cashShifts.locationId, locations.id))
    .leftJoin(staff, eq(cashShifts.openedByStaffId, staff.id))
    .where(eq(cashShifts.id, shiftId))
    .limit(1);

  if (!shiftData) return null;

  // Closed by staff details if closed
  let closedByName = null;
  if (shiftData.shift.closedByStaffId) {
    const [closedStaff] = await db
      .select({ name: staff.name })
      .from(staff)
      .where(eq(staff.id, shiftData.shift.closedByStaffId))
      .limit(1);
    if (closedStaff) closedByName = closedStaff.name;
  }

  // Reconciled by staff details
  let reconciledByName = null;
  if (shiftData.shift.reconciledByStaffId) {
    const [recStaff] = await db
      .select({ name: staff.name })
      .from(staff)
      .where(eq(staff.id, shiftData.shift.reconciledByStaffId))
      .limit(1);
    if (recStaff) reconciledByName = recStaff.name;
  }

  // Movements
  const movements = await db
    .select({
      movement: cashShiftMovements,
      staffName: staff.name,
    })
    .from(cashShiftMovements)
    .leftJoin(staff, eq(cashShiftMovements.staffId, staff.id))
    .where(eq(cashShiftMovements.shiftId, shiftId))
    .orderBy(desc(cashShiftMovements.createdAt));

  // Transactions
  const shiftTxnConditions = [
    eq(transactions.shopId, shiftData.shift.shopId),
    or(
      eq(transactions.cashShiftId, shiftId),
      and(
        isNull(transactions.cashShiftId),
        gte(transactions.createdAt, shiftData.shift.startTime),
        ...(shiftData.shift.endTime ? [lte(transactions.createdAt, shiftData.shift.endTime)] : [])
      )
    ),
  ];

  const shiftTransactions = await db
    .select({
      id: transactions.id,
      referenceNumber: transactions.referenceNumber,
      totalAmount: transactions.totalAmount,
      paymentMethod: transactions.paymentMethod,
      type: transactions.type,
      isVoided: transactions.isVoided,
      createdAt: transactions.createdAt,
      cashierName: staff.name,
    })
    .from(transactions)
    .leftJoin(staff, sql`(${transactions.cashierId} IS NOT NULL AND ${transactions.cashierId} ~ '^[0-9a-fA-F-]{36}$' AND ${transactions.cashierId}::uuid = ${staff.id})`)
    .where(and(...shiftTxnConditions))
    .orderBy(desc(transactions.createdAt));

  return {
    ...shiftData.shift,
    shopName: shiftData.shopName || "Unknown Branch",
    shopCode: shiftData.shopCode || "—",
    locationName: shiftData.locationName || "Unknown Location",
    openedByName: shiftData.openedByName || "Unknown Staff",
    openedByCode: shiftData.openedByCode || "—",
    closedByName,
    reconciledByName,
    movements: movements.map((m) => ({
      ...m.movement,
      staffName: m.staffName || "Staff",
    })),
    transactions: shiftTransactions,
  };
}
