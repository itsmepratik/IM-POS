import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { batches, inventory, productVolumes, products } from "@/lib/db/schema";

const DeleteSchema = z.object({
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
});

export async function DELETE(req: Request) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database is not configured (missing DATABASE_URL)" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const parsed = DeleteSchema.safeParse({
      productId: url.searchParams.get("productId"),
      locationId: url.searchParams.get("locationId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { productId, locationId } = parsed.data;

    const result = await db.transaction(async (tx) => {
      // 1. Find the inventory record for this product at this location
      const [inventoryRecord] = await tx
        .select({ id: inventory.id })
        .from(inventory)
        .where(
          and(
            eq(inventory.productId, productId),
            eq(inventory.locationId, locationId)
          )
        );

      if (!inventoryRecord) {
        throw new Error("Product not found at this location");
      }

      // 2. Delete batches for this inventory
      await tx
        .delete(batches)
        .where(eq(batches.inventoryId, inventoryRecord.id));

      // 3. Delete inventory record
      await tx.delete(inventory).where(eq(inventory.id, inventoryRecord.id));

      // 4. Check if this product exists at other locations
      const [otherLocations] = await tx
        .select({ count: eq(inventory.productId, productId) })
        .from(inventory)
        .where(eq(inventory.productId, productId));

      // 5. If this product doesn't exist at any other location, delete the product and its volumes
      if (!otherLocations) {
        // Delete product volumes
        await tx
          .delete(productVolumes)
          .where(eq(productVolumes.productId, productId));

        // Delete the product itself
        await tx.delete(products).where(eq(products.id, productId));
      }

      return { success: true };
    });

    return NextResponse.json({
      ok: true,
      message: "Product deleted successfully",
    });
  } catch (e: any) {
    const message = e?.message || "Failed to delete product";
    console.error("Delete product error:", e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

