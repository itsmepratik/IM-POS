import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/supabase/server";
// Removed receipt generation imports - we only return stored HTML from checkout

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;

    const parsed = ParamsSchema.safeParse({ id: resolvedParams.id });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = parsed.data;

    // Fetch transaction with all necessary fields
    const { data: transactionData, error } = await supabase
      .from("transactions")
      .select(
        `
        id,
        reference_number,
        type,
        total_amount,
        items_sold,
        payment_method,
        receipt_html,
        battery_bill_html,
        discount_type,
        discount_value,
        discount_amount,
        subtotal_before_discount,
        created_at
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Transaction query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch transaction data" },
        { status: 500 }
      );
    }

    if (!transactionData) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // ALWAYS return the stored HTML if it exists - this is what was generated at checkout
    const existingHtml = transactionData.battery_bill_html || transactionData.receipt_html;
    
    // Log for debugging
    console.log(`[Receipt API] Transaction ${id}:`, {
      hasBatteryBill: !!transactionData.battery_bill_html,
      hasReceiptHtml: !!transactionData.receipt_html,
      batteryBillLength: transactionData.battery_bill_html?.length || 0,
      receiptHtmlLength: transactionData.receipt_html?.length || 0,
      htmlPreview: existingHtml?.substring(0, 200) || 'NO HTML',
    });
    
    if (existingHtml && existingHtml.trim().length > 0) {
      return NextResponse.json({
        ok: true,
        html: existingHtml,
        isBattery: !!transactionData.battery_bill_html,
      });
    }
    
    // If no HTML exists, return error - we should always have HTML from checkout
    return NextResponse.json(
      { 
        ok: false,
        error: "Receipt HTML not found in database. This transaction may not have been processed through checkout.",
        hasItemsSold: !!transactionData.items_sold && Array.isArray(transactionData.items_sold) && transactionData.items_sold.length > 0
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error in receipt endpoint:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        ok: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}



