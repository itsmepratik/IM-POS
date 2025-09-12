import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import {
  CreateTradeInPriceSchema,
  TradeInPriceSchema,
  BatteryCondition,
} from "@/lib/types/trade-in";

// Schema for bulk upsert operation
const BulkUpsertSchema = z.array(CreateTradeInPriceSchema);

type BulkUpsertData = z.infer<typeof BulkUpsertSchema>;

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: tradeInPrices, error } = await supabase
      .from("trade_in_prices")
      .select("*")
      .order("size", { ascending: true })
      .order("condition", { ascending: true });

    if (error) {
      console.error("Error fetching trade-in prices:", error);
      return NextResponse.json(
        { error: "Failed to fetch trade-in prices" },
        { status: 500 }
      );
    }

    // Transform the data to match the expected schema
    const transformedPrices =
      tradeInPrices?.map((price) => ({
        id: price.id,
        size: price.size,
        condition: price.condition as "Scrap" | "Resalable",
        tradeInValue: parseFloat(price.trade_in_value),
        createdAt: new Date(price.created_at),
        updatedAt: new Date(price.updated_at),
      })) || [];

    return NextResponse.json({
      success: true,
      data: transformedPrices,
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/trade-in/prices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const body = await req.json();

    // Validate the request body
    const validationResult = BulkUpsertSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const tradeInPricesData: BulkUpsertData = validationResult.data;

    if (tradeInPricesData.length === 0) {
      return NextResponse.json(
        { error: "No trade-in prices provided" },
        { status: 400 }
      );
    }

    // Process each trade-in price with upsert logic
    const results = [];
    const errors = [];

    for (const priceData of tradeInPricesData) {
      try {
        // Check if a record with the same size and condition exists
        const { data: existingRecord, error: checkError } = await supabase
          .from("trade_in_prices")
          .select("id")
          .eq("size", priceData.size)
          .eq("condition", priceData.condition)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          // PGRST116 is "not found" error, which is expected for new records
          throw checkError;
        }

        if (existingRecord) {
          // Update existing record
          const { data: updatedRecord, error: updateError } = await supabase
            .from("trade_in_prices")
            .update({
              trade_in_value: priceData.tradeInValue.toString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingRecord.id)
            .select()
            .single();

          if (updateError) {
            throw updateError;
          }

          results.push({
            id: updatedRecord.id,
            size: updatedRecord.size,
            condition: updatedRecord.condition,
            tradeInValue: parseFloat(updatedRecord.trade_in_value),
            action: "updated",
          });
        } else {
          // Insert new record
          const { data: newRecord, error: insertError } = await supabase
            .from("trade_in_prices")
            .insert({
              size: priceData.size,
              condition: priceData.condition,
              trade_in_value: priceData.tradeInValue.toString(),
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          results.push({
            id: newRecord.id,
            size: newRecord.size,
            condition: newRecord.condition,
            tradeInValue: parseFloat(newRecord.trade_in_value),
            action: "created",
          });
        }
      } catch (error) {
        console.error(
          `Error processing trade-in price for size ${priceData.size}, condition ${priceData.condition}:`,
          error
        );
        errors.push({
          size: priceData.size,
          condition: priceData.condition,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Return results
    const response = {
      success: true,
      message: `Processed ${results.length} trade-in prices successfully`,
      data: results,
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error in POST /api/trade-in/prices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
