import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// Simple debug endpoint to check transactions table
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const url = new URL(req.url);
    const refNumber = url.searchParams.get("referenceNumber");

    console.log("🔍 Debug: Fetching transaction with reference:", refNumber);

    // First, try to get ALL transactions (limit 10) to see what exists
    const { data: allTrans, error: allError } = await supabase
      .from("transactions")
      .select("reference_number, type, total_amount, created_at")
      .limit(10);

    if (allError) {
      console.error("❌ Error fetching all transactions:", allError);
      return NextResponse.json(
        {
          error: "Failed to fetch transactions",
          details: allError.message,
          hint: allError.hint,
          code: allError.code,
        },
        { status: 500 }
      );
    }

    console.log("✅ Found transactions:", allTrans?.length || 0);

    if (refNumber) {
      // Try to fetch specific transaction WITHOUT customer join
      const { data: specificTrans, error: specificError } = await supabase
        .from("transactions")
        .select("*")
        .eq("reference_number", refNumber);

      if (specificError) {
        console.error("❌ Error fetching specific transaction:", specificError);
        return NextResponse.json(
          {
            error: "Failed to fetch specific transaction",
            details: specificError.message,
            hint: specificError.hint,
            code: specificError.code,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        allTransactions: allTrans,
        searchedFor: refNumber,
        found: specificTrans || [],
        foundCount: specificTrans?.length || 0,
      });
    }

    return NextResponse.json({
      ok: true,
      allTransactions: allTrans,
      message: "Add ?referenceNumber=XXX to search for specific transaction",
    });
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
