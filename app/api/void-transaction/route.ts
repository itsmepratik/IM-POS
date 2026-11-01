import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/db/client";
import { transactions, shops, products, inventory, batches } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireUser, authErrorResponse } from "@/lib/auth/require-user";

export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = req.nextUrl;
    const locationId = searchParams.get("locationId");
    const referenceNumber = searchParams.get("referenceNumber");

    if (referenceNumber) {
      const [tx] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.referenceNumber, referenceNumber))
        .limit(1);

      if (!tx) {
        return NextResponse.json(
          { success: false, error: "Transaction not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: tx.id,
          referenceNumber: tx.referenceNumber,
          type: tx.type,
          totalAmount: tx.totalAmount,
          createdAt: tx.createdAt,
          isVoided: tx.isVoided,
        },
      });
    }

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: "Either referenceNumber or locationId is required" },
        { status: 400 },
      );
    }

    const [lastTx] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.locationId, locationId),
          eq(transactions.type, "SALE"),
          eq(transactions.isVoided, false),
        ),
      )
      .orderBy(desc(transactions.createdAt))
      .limit(1);

    if (!lastTx) {
      return NextResponse.json(
        { success: false, error: "No recent sale transaction found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: lastTx.id,
        referenceNumber: lastTx.referenceNumber,
        type: lastTx.type,
        totalAmount: lastTx.totalAmount,
        createdAt: lastTx.createdAt,
        isVoided: lastTx.isVoided,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to look up transaction",
      },
      { status: 500 },
    );
  }
}

const VoidTransactionSchema = z.object({
  referenceNumber: z.string().min(1, "Reference number is required"),
  supervisorPassword: z.string().min(1, "Supervisor password is required"),
  // Accepted for backwards compatibility but NOT trusted: the supervisor
  // password is always checked against the shop that made the sale.
  locationId: z.string().uuid().optional(),
  shopId: z.string().uuid().optional(),
  voidReason: z.string().optional(),
});

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const db = getDatabase();
    const body: unknown = await req.json();

    const validatedInput = VoidTransactionSchema.parse(body);
    const { referenceNumber, supervisorPassword, voidReason } = validatedInput;

    // Resolve the owning shop from the sale itself. Previously the client's
    // shopId/locationId chose the shop, and a location-only lookup picked an
    // arbitrary shop at that location (Saniya2 voids were checked against
    // Saniya1's supervisor password).
    const [owner] = await db
      .select({ shopId: transactions.shopId })
      .from(transactions)
      .where(eq(transactions.referenceNumber, referenceNumber))
      .limit(1);
    if (!owner) {
      return NextResponse.json(
        { success: false, error: `Transaction with reference ${referenceNumber} not found` },
        { status: 404 },
      );
    }
    if (!owner.shopId) {
      return NextResponse.json(
        { success: false, error: "Transaction has no shop; it cannot be voided from the POS." },
        { status: 400 },
      );
    }

    const [shop] = await db
      .select({ supervisorPasswordHash: shops.supervisorPasswordHash })
      .from(shops)
      .where(eq(shops.id, owner.shopId))
      .limit(1);

    if (!shop || !shop.supervisorPasswordHash) {
      return NextResponse.json(
        { success: false, error: "Supervisor password not configured for this shop. Set it in Settings." },
        { status: 400 },
      );
    }

    const passwordValid = await bcrypt.compare(supervisorPassword, shop.supervisorPasswordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid supervisor password" },
        { status: 401 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const [transaction] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.referenceNumber, referenceNumber))
        .limit(1);

      if (!transaction) {
        throw new Error(`Transaction with reference ${referenceNumber} not found`);
      }

      if (transaction.isVoided) {
        throw new Error(`Transaction ${referenceNumber} is already voided`);
      }

      if (transaction.type !== "SALE") {
        throw new Error(`Cannot void a ${transaction.type} transaction. Only SALE transactions can be voided`);
      }

      const items = (transaction.itemsSold as Array<{
        productId: string;
        quantity: number;
        sellingPrice: number;
        volumeDescription?: string;
        batchId?: string;
      }>) || [];

      // Labor / service lines carry non-UUID ids (e.g. "9999") and have no
      // stock to restore — previously they made every such sale un-voidable.
      const stockItems = items.filter((item) => UUID_PATTERN.test(item.productId));

      if (stockItems.length > 0) {
        const productIds = stockItems.map((item) => item.productId);
        // inArray, not and(eq, eq, ...): an AND of different ids never matched
        // more than one product, so multi-item voids lost product metadata.
        const productsData = await tx
          .select()
          .from(products)
          .where(inArray(products.id, productIds));

        const knownProductIds = new Set(productsData.map((p) => p.id));

        // Stock is derived from batches: create_checkout_transaction deducts
        // batches.stock_remaining FIFO and tr_sync_inventory_from_batches
        // recomputes inventory. Restore the same quantity to a batch so the
        // trigger recomputes inventory — writing inventory directly (old code)
        // was overwritten by the next batch change, and every line with a
        // volumeDescription was wrongly restocked as closed lubricant bottles.
        for (const item of stockItems) {
          if (!knownProductIds.has(item.productId)) continue; // product deleted since sale

          const [inventoryRecord] = await tx
            .select({ id: inventory.id, standardStock: inventory.standardStock })
            .from(inventory)
            .where(
              and(
                eq(inventory.productId, item.productId),
                eq(inventory.locationId, transaction.locationId),
              ),
            )
            .limit(1);

          if (!inventoryRecord) {
            throw new Error(`Inventory not found for product ${item.productId}`);
          }

          // Prefer the batch recorded on the sale line, else the newest batch.
          const recordedBatchId =
            typeof item.batchId === "string" && UUID_PATTERN.test(item.batchId)
              ? item.batchId
              : null;
          const [targetBatch] = await tx
            .select({ id: batches.id, stockRemaining: batches.stockRemaining })
            .from(batches)
            .where(
              recordedBatchId
                ? and(eq(batches.id, recordedBatchId), eq(batches.inventoryId, inventoryRecord.id))
                : eq(batches.inventoryId, inventoryRecord.id),
            )
            .orderBy(desc(batches.purchaseDate))
            .limit(1);

          if (targetBatch) {
            await tx
              .update(batches)
              .set({
                stockRemaining: targetBatch.stockRemaining + Math.round(item.quantity),
                isActiveBatch: true,
              })
              .where(eq(batches.id, targetBatch.id));
          } else {
            // No batch history for this item: adjust inventory directly.
            await tx
              .update(inventory)
              .set({
                standardStock: (inventoryRecord.standardStock ?? 0) + Math.round(item.quantity),
              })
              .where(eq(inventory.id, inventoryRecord.id));
          }
        }
      }

      const [voidedTransaction] = await tx
        .update(transactions)
        .set({
          isVoided: true,
          voidedAt: new Date(),
          voidReason: voidReason || null,
        })
        .where(eq(transactions.id, transaction.id))
        .returning();

      return voidedTransaction;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Transaction ${referenceNumber} voided successfully`,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during void",
      },
      { status: 500 },
    );
  }
}
