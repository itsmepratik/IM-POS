"use server";

import { db } from "@/lib/db/client";
import { inventory, batches, products, categories } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/db/cache-tags";

export async function submitPurchaseOrder(
  locationId: string,
  supplier: string,
  items: { productId: string; quantity: number; costPrice: number }[],
) {
  try {
    await db.transaction(async (tx) => {
      for (const item of items) {
        // 1. Get the product and category
        const productRecords = await tx
          .select({
            id: products.id,
            categoryId: products.categoryId,
            categoryName: categories.name,
          })
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(eq(products.id, item.productId))
          .limit(1);

        const productRow = productRecords[0];
        if (!productRow) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const isLubricant = productRow.categoryName
          ?.toLowerCase()
          .includes("lubricant");

        // 2. Find or create inventory record
        const invRecords = await tx
          .select()
          .from(inventory)
          .where(
            and(
              eq(inventory.productId, item.productId),
              eq(inventory.locationId, locationId),
            ),
          )
          .limit(1);

        let inv = invRecords[0];

        if (!inv) {
          const [newInv] = await tx
            .insert(inventory)
            .values({
              productId: item.productId,
              locationId: locationId,
              standardStock: isLubricant ? 0 : item.quantity,
              closedBottlesStock: isLubricant ? item.quantity : 0,
              openBottlesStock: 0,
            })
            .returning();
          inv = newInv;
        } else {
          // Update existing inventory
          await tx
            .update(inventory)
            .set({
              standardStock: isLubricant
                ? inv.standardStock
                : (inv.standardStock || 0) + item.quantity,
              closedBottlesStock: isLubricant
                ? (inv.closedBottlesStock || 0) + item.quantity
                : inv.closedBottlesStock,
            })
            .where(eq(inventory.id, inv.id));
        }

        // 3. Increment batch number
        const lastBatchRecords = await tx
          .select({ batchNumber: batches.batchNumber })
          .from(batches)
          .where(eq(batches.inventoryId, inv.id))
          .orderBy(desc(batches.batchNumber))
          .limit(1);

        const nextBatchNumber =
          lastBatchRecords.length > 0
            ? (lastBatchRecords[0].batchNumber || 0) + 1
            : 1;

        // 4. Create batch record
        await tx.insert(batches).values({
          inventoryId: inv.id,
          costPrice: item.costPrice.toString(),
          quantityReceived: item.quantity,
          stockRemaining: item.quantity,
          supplier: supplier,
          isActiveBatch: true,
          batchNumber: nextBatchNumber,
        });
      }
    });

    revalidatePath("/inventory", "layout");
    revalidatePath("/inventory/main-inventory");
    revalidatePath("/inventory/branch-inventory");
    revalidatePath("/purchase-orders", "layout");
    revalidateTag(CACHE_TAGS.inventory(locationId));
    revalidateTag(CACHE_TAGS.ALL_PRODUCTS);

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting purchase order:", error);
    return { success: false, error: error.message };
  }
}
