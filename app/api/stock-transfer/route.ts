import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import {
  transactions,
  locations,
  inventory,
  batches,
  products,
  categories,
} from "@/lib/db/schema";
import { eq, and, asc, gt, inArray } from "drizzle-orm";
import { generateReferenceNumber } from "@/lib/utils/reference-numbers";

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
      id: z.union([z.number(), z.string()]), // Accept both numeric and UUID string
      originalId: z.string().optional(), // UUID for database operations
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

    // Validate cashier/staff ID and convert to UUID
    const { getStaffUuidById } = await import("@/lib/utils/staff-validation");
    const staffUuid = await getStaffUuidById(cashierId);
    
    if (!staffUuid) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid cashier ID",
          message: `No active staff member found with ID: ${cashierId}`,
        },
        { status: 400 }
      );
    }

    console.log(`✅ Cashier validated and converted to UUID: ${staffUuid}`);

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

    // Generate sequential reference number using ST prefix
    const referenceNumber = await generateReferenceNumber(
      "STOCK_TRANSFER",
      false, // Not a battery sale
      "TRANSFER"
    );

    // Format items for storage (use UUID for productId)
    const formattedItems = items.map((item) => {
      const productId = item.originalId || (typeof item.id === 'string' ? item.id : item.id.toString());
      return {
        productId, // Use UUID
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        details: item.details,
      };
    });

    // Perform all operations in a database transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create the stock transfer transaction
      console.log("🔄 Creating stock transfer transaction:", {
        referenceNumber,
        sourceLocationId: actualSourceLocationId,
        destinationLocationId: actualDestinationLocationId,
        cashierId,
        itemsCount: formattedItems.length,
        totalAmount,
      });

      const [transaction] = await tx
        .insert(transactions)
        .values({
          referenceNumber,
          locationId: actualSourceLocationId, // Source location
          shopId: actualDestinationLocationId, // Destination location (using shopId field)
          cashierId: staffUuid, // Use UUID instead of staff_id text
          type: "STOCK_TRANSFER",
          totalAmount: totalAmount.toString(),
          itemsSold: formattedItems,
          paymentMethod: "TRANSFER", // Special payment method for transfers
          receiptHtml: null,
          batteryBillHtml: null,
          originalReferenceNumber: null,
        })
        .returning();

      // 2. Fetch product information to determine product types
      // Use originalId (UUID) if available, otherwise try to use id as UUID
      const productIds = items.map((item) => {
        // Prefer originalId if provided (UUID from frontend)
        if (item.originalId) {
          return item.originalId;
        }
        // Otherwise, try id as UUID string
        const id = typeof item.id === 'string' ? item.id : item.id.toString();
        // Check if it looks like a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(id)) {
          return id;
        }
        // If not a UUID, we can't proceed - this shouldn't happen if originalId is provided
        throw new Error(`Invalid product ID format for item ${item.name}. Expected UUID but got: ${id}`);
      });
      
      const productsData = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds));

      const productMap = new Map();
      productsData.forEach((product) => {
        productMap.set(product.id, product); // Use UUID directly
      });

      // Fetch categories for lubricant detection
      const categoryIds = [...new Set(productsData.map((p) => p.categoryId))];
      const categoriesData = await tx
        .select()
        .from(categories)
        .where(inArray(categories.id, categoryIds));

      const categoryMap = new Map();
      categoriesData.forEach((category) => {
        categoryMap.set(category.id, category.name);
      });

      // 3. Process each item and deduct stock from source location
      for (const item of items) {
        // Use originalId (UUID) if available, otherwise use id as UUID
        const productId = item.originalId || (typeof item.id === 'string' ? item.id : item.id.toString());

        // Find inventory record at source location
        const [inventoryRecord] = await tx
          .select()
          .from(inventory)
          .where(
            and(
              eq(inventory.productId, productId),
              eq(inventory.locationId, actualSourceLocationId)
            )
          )
          .limit(1);

        if (!inventoryRecord) {
          throw new Error(
            `Inventory not found for product ${item.name} (ID: ${productId}) at source location`
          );
        }

        const product = productMap.get(productId);
        const categoryName = product
          ? categoryMap.get(product.categoryId)
          : null;
        const isLubricant = categoryName === "Lubricants";

        console.log(
          `🔄 Processing transfer item: ${item.name} (${item.quantity} units)`,
          {
            productId,
            isLubricant,
            categoryName,
            currentStock: inventoryRecord.standardStock,
            closedBottles: inventoryRecord.closedBottlesStock,
            openBottles: inventoryRecord.openBottlesStock,
          }
        );

        // Handle lubricants differently
        if (isLubricant) {
          // For lubricants, deduct from closed bottles stock
          if (
            (inventoryRecord.closedBottlesStock ?? 0) < item.quantity
          ) {
            throw new Error(
              `Insufficient closed bottles stock for product ${item.name}. Available: ${inventoryRecord.closedBottlesStock ?? 0}, Required: ${item.quantity}`
            );
          }

          await tx
            .update(inventory)
            .set({
              closedBottlesStock:
                (inventoryRecord.closedBottlesStock ?? 0) - item.quantity,
            })
            .where(eq(inventory.id, inventoryRecord.id));
        } else {
          // For regular products, use FIFO batch logic
          // Find the active batch (FIFO - oldest first)
          let activeBatch = await tx
            .select()
            .from(batches)
            .where(
              and(
                eq(batches.inventoryId, inventoryRecord.id),
                eq(batches.isActiveBatch, true)
              )
            )
            .orderBy(asc(batches.purchaseDate))
            .limit(1)
            .then((result) => result[0]);

          if (!activeBatch) {
            // Try to find any batch with remaining stock
            const anyBatch = await tx
              .select()
              .from(batches)
              .where(
                and(
                  eq(batches.inventoryId, inventoryRecord.id),
                  gt(batches.stockRemaining, 0)
                )
              )
              .orderBy(asc(batches.purchaseDate))
              .limit(1)
              .then((result) => result[0]);

            if (anyBatch) {
              // Activate this batch
              await tx
                .update(batches)
                .set({ isActiveBatch: true })
                .where(eq(batches.id, anyBatch.id));
              activeBatch = { ...anyBatch, isActiveBatch: true };
            } else {
              // No batches exist - check if we have standard stock
              const currentStock = inventoryRecord.standardStock ?? 0;
              if (currentStock < item.quantity) {
                throw new Error(
                  `Insufficient stock for product ${item.name}. Available: ${currentStock}, Required: ${item.quantity}`
                );
              }
              // Update standard stock directly
              await tx
                .update(inventory)
                .set({
                  standardStock: currentStock - item.quantity,
                })
                .where(eq(inventory.id, inventoryRecord.id));
              continue; // Skip batch processing
            }
          }

          // Check if we have enough stock in the active batch
          if (activeBatch.stockRemaining < item.quantity) {
            throw new Error(
              `Insufficient stock in active batch for product ${item.name}. Available: ${activeBatch.stockRemaining}, Required: ${item.quantity}`
            );
          }

          // Decrement stock from active batch
          await tx
            .update(batches)
            .set({
              stockRemaining: activeBatch.stockRemaining - item.quantity,
            })
            .where(eq(batches.id, activeBatch.id));

          // FIFO Rule: If depleting the active batch, deactivate it and activate next oldest
          if (activeBatch.stockRemaining - item.quantity === 0) {
            await tx
              .update(batches)
              .set({ isActiveBatch: false })
              .where(eq(batches.id, activeBatch.id));

            // Find and activate the next oldest batch with stock
            const [nextBatch] = await tx
              .select()
              .from(batches)
              .where(
                and(
                  eq(batches.inventoryId, inventoryRecord.id),
                  eq(batches.isActiveBatch, false),
                  gt(batches.stockRemaining, 0)
                )
              )
              .orderBy(asc(batches.purchaseDate))
              .limit(1);

            if (nextBatch) {
              await tx
                .update(batches)
                .set({ isActiveBatch: true })
                .where(eq(batches.id, nextBatch.id));
            }
          }

          // Update inventory standard stock
          const currentStock = inventoryRecord.standardStock ?? 0;
          if (currentStock < item.quantity) {
            throw new Error(
              `Insufficient standard stock for product ${item.name}. Available: ${currentStock}, Required: ${item.quantity}`
            );
          }

          await tx
            .update(inventory)
            .set({
              standardStock: currentStock - item.quantity,
            })
            .where(eq(inventory.id, inventoryRecord.id));
        }

        console.log(
          `✅ Stock deducted for ${item.name}: ${item.quantity} units`
        );
      }

      return transaction;
    });

    console.log("✅ Stock transfer transaction created successfully:", {
      id: result.id,
      referenceNumber: result.referenceNumber,
      type: result.type,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Stock transfer transaction created successfully",
        transaction: {
          id: result.id,
          referenceNumber: result.referenceNumber,
          type: result.type,
          totalAmount: result.totalAmount,
          createdAt: result.createdAt,
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
