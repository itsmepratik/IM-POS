import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/supabase/server";

// Settlement request schema
const SettlementRequestSchema = z.object({
  referenceNumber: z.string().min(1, "Reference number is required"),
  cashierId: z.string().min(1, "Cashier ID is required"),
  paymentMethod: z.enum(["CASH", "CARD", "MOBILE"]).default("CASH").optional(),
});

type SettlementRequest = z.infer<typeof SettlementRequestSchema>;

/**
 * POST /api/settle-transaction
 *
 * Settles on_hold or credit transactions by creating new transactions
 * with ON_HOLD_PAID or CREDIT_PAID status
 */
export async function POST(req: NextRequest) {
  const requestId = `settle-${Date.now()}`;
  console.log(`[${requestId}] Settlement request received`);

  try {
    const body = await req.json();

    // Validate request body
    const validation = SettlementRequestSchema.safeParse(body);
    if (!validation.success) {
      console.error(`[${requestId}] Validation error:`, validation.error);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      referenceNumber,
      cashierId,
      paymentMethod = "CASH",
    }: SettlementRequest = validation.data;

    const supabase = await createClient();

    // Step 1: Fetch the original transaction
    console.log(
      `[${requestId}] Fetching original transaction: ${referenceNumber}`
    );

    const { data: originalTransaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("reference_number", referenceNumber)
      .single();

    if (fetchError || !originalTransaction) {
      console.error(`[${requestId}] Transaction not found:`, fetchError);
      return NextResponse.json(
        {
          success: false,
          error: "Transaction not found",
          details: fetchError?.message,
        },
        { status: 404 }
      );
    }

    // Step 2: Validate transaction type (only ON_HOLD and CREDIT can be settled)
    if (
      originalTransaction.type !== "ON_HOLD" &&
      originalTransaction.type !== "CREDIT"
    ) {
      console.error(
        `[${requestId}] Invalid transaction type: ${originalTransaction.type}`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Only ON_HOLD and CREDIT transactions can be settled",
          details: `Transaction type is ${originalTransaction.type}`,
        },
        { status: 400 }
      );
    }

    // Step 3: Check if already settled (prevent duplicate settlements)
    console.log(`[${requestId}] Checking for existing settlement`);

    const { data: existingSettlement, error: settlementCheckError } =
      await supabase
        .from("transactions")
        .select("id, reference_number")
        .eq("original_reference_number", referenceNumber)
        .in("type", ["ON_HOLD_PAID", "CREDIT_PAID"])
        .maybeSingle();

    if (settlementCheckError) {
      console.error(
        `[${requestId}] Error checking for settlement:`,
        settlementCheckError
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check settlement status",
          details: settlementCheckError.message,
        },
        { status: 500 }
      );
    }

    if (existingSettlement) {
      console.warn(
        `[${requestId}] Transaction already settled: ${existingSettlement.reference_number}`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Transaction already settled",
          details: `Settlement reference: ${existingSettlement.reference_number}`,
        },
        { status: 409 }
      );
    }

    // Step 4: Verify cashier exists
    const { data: cashier, error: cashierError } = await supabase
      .from("staff")
      .select("staff_id, name")
      .eq("staff_id", cashierId)
      .eq("is_active", true)
      .single();

    if (cashierError || !cashier) {
      console.error(`[${requestId}] Cashier not found:`, cashierError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cashier ID",
          details: cashierError?.message,
        },
        { status: 400 }
      );
    }

    // Step 5: Generate new reference number for settlement transaction
    const settlementType =
      originalTransaction.type === "ON_HOLD" ? "ON_HOLD_PAID" : "CREDIT_PAID";
    const timestamp = Date.now();
    const newReferenceNumber = `${settlementType}-${timestamp}`;

    console.log(
      `[${requestId}] Creating settlement transaction: ${newReferenceNumber}`
    );

    // Step 6: Create new settlement transaction
    const settlementData = {
      reference_number: newReferenceNumber,
      location_id: originalTransaction.location_id,
      shop_id: originalTransaction.shop_id,
      cashier_id: cashierId,
      type: settlementType,
      total_amount: originalTransaction.total_amount,
      items_sold: originalTransaction.items_sold,
      payment_method: paymentMethod,
      car_plate_number: originalTransaction.car_plate_number,
      customer_id: originalTransaction.customer_id,
      original_reference_number: referenceNumber,
      receipt_html: null, // Will be generated on frontend if needed
      battery_bill_html: null,
      created_at: new Date().toISOString(),
    };

    const { data: settlementTransaction, error: insertError } = await supabase
      .from("transactions")
      .insert(settlementData)
      .select()
      .single();

    if (insertError || !settlementTransaction) {
      console.error(`[${requestId}] Failed to create settlement:`, insertError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create settlement transaction",
          details: insertError?.message,
        },
        { status: 500 }
      );
    }

    console.log(
      `[${requestId}] Settlement successful: ${settlementTransaction.reference_number}`
    );

    // Step 7: Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          settlementTransaction: {
            id: settlementTransaction.id,
            referenceNumber: settlementTransaction.reference_number,
            type: settlementTransaction.type,
            totalAmount: settlementTransaction.total_amount,
            paymentMethod: settlementTransaction.payment_method,
            createdAt: settlementTransaction.created_at,
          },
          originalTransaction: {
            referenceNumber: originalTransaction.reference_number,
            type: originalTransaction.type,
            totalAmount: originalTransaction.total_amount,
          },
          cashier: {
            id: cashier.staff_id,
            name: cashier.name,
          },
        },
        message: `${
          originalTransaction.type === "ON_HOLD" ? "On-hold" : "Credit"
        } transaction successfully settled`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/settle-transaction?reference=XXX
 *
 * Check if a transaction is eligible for settlement
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const referenceNumber = url.searchParams.get("reference");

    if (!referenceNumber) {
      return NextResponse.json(
        { success: false, error: "Reference number is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select(
        "id, reference_number, type, total_amount, created_at, customer_id, customers(name, phone)"
      )
      .eq("reference_number", referenceNumber)
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction not found",
        },
        { status: 404 }
      );
    }

    // Check if eligible for settlement
    const isEligible =
      transaction.type === "ON_HOLD" || transaction.type === "CREDIT";

    // Check if already settled
    const { data: existingSettlement } = await supabase
      .from("transactions")
      .select("reference_number, created_at")
      .eq("original_reference_number", referenceNumber)
      .in("type", ["ON_HOLD_PAID", "CREDIT_PAID"])
      .maybeSingle();

    return NextResponse.json({
      success: true,
      data: {
        transaction: {
          referenceNumber: transaction.reference_number,
          type: transaction.type,
          totalAmount: transaction.total_amount,
          createdAt: transaction.created_at,
          customer: transaction.customers,
        },
        isEligible,
        isSettled: !!existingSettlement,
        settlement: existingSettlement
          ? {
              referenceNumber: existingSettlement.reference_number,
              settledAt: existingSettlement.created_at,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error checking settlement eligibility:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
