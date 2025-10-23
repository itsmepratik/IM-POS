import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { transactions } from "@/lib/db/schema";

// Input validation schema
const MiscellaneousDeductionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  cashierId: z.string().min(1, "Cashier ID is required"),
  locationId: z.string().uuid("Valid location ID is required"),
  shopId: z.string().uuid().optional(),
});

/**
 * API endpoint to create a miscellaneous deduction transaction
 * Creates a negative transaction record (deduction)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedInput = MiscellaneousDeductionSchema.parse(body);
    const { amount, cashierId, locationId, shopId } = validatedInput;

    // Generate reference number with MISC prefix
    const timestamp = Date.now().toString().slice(-8);
    const referenceNumber = `MISC-${timestamp}`;

    // Create the negative transaction as EXPENSE type
    const [transaction] = await db
      .insert(transactions)
      .values({
        referenceNumber,
        locationId,
        shopId: shopId || null,
        cashierId,
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
          errors: error.errors,
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
