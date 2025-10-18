import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/supabase/server";

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    const parsed = ParamsSchema.safeParse({ id: params.id });

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

    return NextResponse.json({
      ok: true,
      transaction: transactionData,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
