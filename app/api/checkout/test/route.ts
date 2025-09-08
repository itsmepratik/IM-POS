import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import {
  transactions,
  inventory,
  batches,
  products,
  locations,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Get some sample data to test with
    const [location] = await db.select().from(locations).limit(1);
    const [product] = await db.select().from(products).limit(1);

    if (!location || !product) {
      return NextResponse.json({
        success: false,
        error:
          "No sample data available. Please ensure you have locations and products in the database.",
      });
    }

    // Check if inventory exists for this product and location
    const [inventoryRecord] = await db
      .select()
      .from(inventory)
      .where(
        eq(inventory.productId, product.id) &&
          eq(inventory.locationId, location.id)
      )
      .limit(1);

    if (!inventoryRecord) {
      return NextResponse.json({
        success: false,
        error: `No inventory found for product ${product.name} at location ${location.name}. Please create inventory first.`,
      });
    }

    // Check if batches exist
    const availableBatches = await db
      .select()
      .from(batches)
      .where(eq(batches.inventoryId, inventoryRecord.id));

    if (availableBatches.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No batches found for inventory ${inventoryRecord.id}. Please create batches first.`,
      });
    }

    // Return test data structure
    return NextResponse.json({
      success: true,
      testData: {
        location: {
          id: location.id,
          name: location.name,
        },
        product: {
          id: product.id,
          name: product.name,
          productType: product.productType,
        },
        inventory: {
          id: inventoryRecord.id,
          standardStock: inventoryRecord.standardStock,
          closedBottlesStock: inventoryRecord.closedBottlesStock,
          openBottlesStock: inventoryRecord.openBottlesStock,
          totalStock: inventoryRecord.totalStock,
        },
        batches: availableBatches.map((batch) => ({
          id: batch.id,
          stockRemaining: batch.stockRemaining,
          purchaseDate: batch.purchaseDate,
          isActiveBatch: batch.isActiveBatch,
        })),
        sampleCheckoutPayload: {
          locationId: location.id,
          paymentMethod: "CASH",
          cashierId: "test-cashier-id",
          cart: [
            {
              productId: product.id,
              quantity: 1,
              sellingPrice: 10.0,
              volumeDescription:
                product.productType === "lubricant" ? "5L" : undefined,
            },
          ],
          tradeIns: [
            {
              productId: product.id, // Using same product for simplicity
              quantity: 1,
              tradeInValue: 2.0,
            },
          ],
        },
      },
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
