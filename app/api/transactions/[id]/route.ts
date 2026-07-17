import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/supabase/server";

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: rawId } = await params;

    const parsed = ParamsSchema.safeParse({ id: rawId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = parsed.data;

    const { data: transactionData, error } = await supabase
      .from("transactions")
      .select(
        `
        id,
        reference_number,
        location_id,
        shop_id,
        cashier_id,
        type,
        total_amount,
        items_sold,
        payment_method,
        receipt_html,
        battery_bill_html,
        original_reference_number,
        car_plate_number,
        mobile_payment_account,
        mobile_number,
        notes,
        discount_type,
        discount_value,
        discount_amount,
        subtotal_before_discount,
        created_at,
        customer_id,
        customers (
          id,
          name,
          email,
          phone
        ),
        shops (
          id,
          name,
          display_name
        ),
        staff!transactions_cashier_id_staff_id_fk (
          id,
          staff_id,
          name
        )
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

    // Fetch trade-in transactions for this transaction
    const { data: tradeIns } = await supabase
      .from("trade_in_transactions")
      .select(`
        id,
        product_id,
        quantity,
        trade_in_value,
        created_at,
        products ( name )
      `)
      .eq("transaction_id", id);

    // Calculate total trade-in amount
    const tradeInTotal = (tradeIns || []).reduce(
      (sum: number, ti: { trade_in_value: string | number }) =>
        sum + parseFloat(String(ti.trade_in_value)),
      0
    );

    // If no customer is linked but we have an original reference, try to get customer from original transaction
    if (!transactionData.customers && transactionData.original_reference_number) {
      const { data: originalTx } = await supabase
        .from("transactions")
        .select(`
          customers (
            id,
            name,
            email,
            phone
          )
        `)
        .eq("reference_number", transactionData.original_reference_number)
        .single();

      if (originalTx?.customers) {
        // @ts-ignore - We're manually patching the customer data
        transactionData.customers = originalTx.customers;
        // @ts-ignore - We're manually patching the customer data
        transactionData.customer_id = originalTx.customers.id;
      }
    }

    return NextResponse.json({
      ok: true,
      transaction: {
        ...transactionData,
        tradeIns: tradeIns || [],
        tradeInTotal,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
