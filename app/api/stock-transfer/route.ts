import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { transactions, locations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Input validation schema
const StockTransferSchema = z.object({
  transferId: z.string().min(1, "Transfer ID is required"),
  sourceLocationId: z.string().min(1, "Valid source location ID is required"),
  destinationLocationId: z
    .string()
    .min(1, "Valid destination location ID is required"),
  cashierId: z.string().min(1, "Cashier ID is required"),
  items: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      price: z.number(),
      quantity: z.number(),
      details: z.string().optional(),
    })
  ),
  totalAmount: z.number(),
  targetDate: z.string().optional(),
});

/**
 * API endpoint to create a stock transfer transaction
 * Creates a STOCK_TRANSFER type transaction record
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedInput = StockTransferSchema.parse(body);
    const {
      transferId,
      sourceLocationId,
      destinationLocationId,
      cashierId,
      items,
      totalAmount,
      targetDate,
    } = validatedInput;

    // Helper function to get or map location ID
    const getValidLocationId = async (
      locationId: string,
      locationName: string
    ): Promise<string> => {
      // If it looks like a UUID, use it directly
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(locationId)) {
        return locationId;
      }

      // Otherwise, try to find the location by name in the database
      const [location] = await db
        .select({ id: locations.id })
        .from(locations)
        .where(eq(locations.name, locationName))
        .limit(1);

      if (location) {
        return location.id;
      }

      // If no location found, get the first available location as fallback
      const [firstLocation] = await db
        .select({ id: locations.id })
        .from(locations)
        .limit(1);

      if (!firstLocation) {
        throw new Error("No locations available in the database");
      }

      return firstLocation.id;
    };

    // Map the location IDs to actual database UUIDs
    const actualSourceLocationId = await getValidLocationId(
      sourceLocationId,
      sourceLocationId === "loc0" ? "Sanaiya (Main)" : "Unknown"
    );
    const actualDestinationLocationId = await getValidLocationId(
      destinationLocationId,
      destinationLocationId === "loc1"
        ? "Abu Dhurus"
        : destinationLocationId === "loc2"
        ? "Hafith"
        : "Unknown"
    );

    // Generate reference number with TRANSFER prefix if not provided
    const referenceNumber =
      transferId || `TRANSFER-${Date.now().toString().slice(-8)}`;

    // Format items for storage
    const formattedItems = items.map((item) => ({
      productId: item.id.toString(),
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
      details: item.details,
    }));

    // Create the stock transfer transaction
    console.log("🔄 Creating stock transfer transaction:", {
      referenceNumber,
      sourceLocationId: actualSourceLocationId,
      destinationLocationId: actualDestinationLocationId,
      cashierId,
      itemsCount: formattedItems.length,
      totalAmount,
    });

    const [transaction] = await db
      .insert(transactions)
      .values({
        referenceNumber,
        locationId: actualSourceLocationId, // Source location
        shopId: actualDestinationLocationId, // Destination location (using shopId field)
        cashierId,
        type: "STOCK_TRANSFER",
        totalAmount: totalAmount.toString(),
        itemsSold: formattedItems,
        paymentMethod: "TRANSFER", // Special payment method for transfers
        receiptHtml: null,
        batteryBillHtml: null,
        originalReferenceNumber: null,
      })
      .returning();

    console.log("✅ Stock transfer transaction created successfully:", {
      id: transaction.id,
      referenceNumber: transaction.referenceNumber,
      type: transaction.type,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Stock transfer transaction created successfully",
        transaction: {
          id: transaction.id,
          referenceNumber: transaction.referenceNumber,
          type: transaction.type,
          totalAmount: transaction.totalAmount,
          createdAt: transaction.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating stock transfer transaction:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid input data",
          details: error.errors,
          message: error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", "),
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Failed to create stock transfer transaction",
      },
      { status: 500 }
    );
  }
}
