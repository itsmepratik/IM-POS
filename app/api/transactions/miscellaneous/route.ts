import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/db/client";
import { transactions, shops, cashShifts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

// Input validation schema. The shop is required and is the source of truth
// for the location; the client-supplied locationId is ignored.
const MiscellaneousDeductionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  cashierId: z.string().min(1, "Cashier ID is required"),
  locationId: z.string().uuid().optional(),
  shopId: z.string().uuid("A valid shop must be selected"),
});

/**
 * API endpoint to create a miscellaneous deduction transaction
 * Creates a negative transaction record (deduction)
 */
export async function POST(req: NextRequest) {
  try {
    const db = getDatabase();
    const body = await req.json();

    // Validate input
    const validatedInput = MiscellaneousDeductionSchema.parse(body);
    const { amount, cashierId, shopId } = validatedInput;

    // Validate cashier/staff ID and convert to UUID
    const { getStaffUuidById } = await import("@/lib/utils/staff-validation");
    const staffUuid = await getStaffUuidById(cashierId);
    
    if (!staffUuid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid cashier ID",
          error: `No active staff member found with ID: ${cashierId}`,
        },
        { status: 400 }
      );
    }

    const [shopData] = await db
      .select({ locationId: shops.locationId })
      .from(shops)
      .where(eq(shops.id, shopId))
      .limit(1);
    if (!shopData) {
      return NextResponse.json(
        { success: false, message: `Shop ${shopId} does not exist` },
        { status: 400 }
      );
    }
    const actualLocationId: string = shopData.locationId;

    // Record against this shop's open cash shift (if any) for reconciliation.
    const [openShift] = await db
      .select({ id: cashShifts.id })
      .from(cashShifts)
      .where(and(eq(cashShifts.shopId, shopId), eq(cashShifts.status, "open")))
      .limit(1);

    // Collision-free reference (previously the last 8 ms digits of Date.now()).
    const referenceNumber = `MISC-${randomUUID().slice(0, 13).toUpperCase()}`;

    // Create the negative transaction as EXPENSE type
    const [transaction] = await db
      .insert(transactions)
      .values({
        referenceNumber,
        locationId: actualLocationId,
        shopId,
        cashShiftId: openShift?.id ?? null,
        cashierId: staffUuid, // Use UUID instead of staff_id text
        type: "EXPENSE",
        totalAmount: (-amount).toString(), // Negative amount for expense
        itemsSold: [
          {
            productId: "miscellaneous",
            productName: "Miscellaneous Expense",
            quantity: 1,
            price: -amount,
          },
        ],
        paymentMethod: "CASH", // Default to cash for expenses
        receiptHtml: null,
        batteryBillHtml: null,
        originalReferenceNumber: null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Miscellaneous deduction recorded successfully",
        referenceNumber: transaction.referenceNumber,
        amount: -amount,
        transactionId: transaction.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing miscellaneous deduction:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process miscellaneous deduction",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
