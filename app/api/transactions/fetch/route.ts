import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/supabase/client";

const QuerySchema = z.object({
  shopId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type QueryParams = z.infer<typeof QuerySchema>;

export async function GET(req: Request) {
  try {
    const supabase = createClient();

    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      shopId: url.searchParams.get("shopId") || undefined,
      locationId: url.searchParams.get("locationId") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const qp: QueryParams = parsed.data;

    // Build the query
    let query = supabase
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
      .order("created_at", { ascending: false });

    // Apply filters
    if (qp.shopId) {
      query = query.eq("shop_id", qp.shopId);
    }

    if (qp.locationId) {
      query = query.eq("location_id", qp.locationId);
    }

    if (qp.startDate) {
      query = query.gte("created_at", qp.startDate);
    }

    if (qp.endDate) {
      query = query.lte("created_at", qp.endDate);
    }

    const { data: transactionsData, error } = await query;

    if (error) {
      console.error("Transactions query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      transactions: transactionsData || [],
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
