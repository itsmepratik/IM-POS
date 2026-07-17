import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { transactions, shops, products, inventory } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
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
  locationId: z.string().uuid(),
  shopId: z.string().uuid().optional(),
  voidReason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validatedInput = VoidTransactionSchema.parse(body);
    const { referenceNumber, supervisorPassword, locationId, shopId, voidReason } = validatedInput;

    const shopFilter = shopId ? eq(shops.id, shopId) : eq(shops.locationId, locationId);

    const [shop] = await db
      .select()
      .from(shops)
      .where(shopFilter)
      .limit(1);

    if (!shop || !shop.supervisorPasswordHash) {
      return NextResponse.json(
        { success: false, error: "Supervisor password not configured. Set it in Settings." },
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
      }>) || [];

      if (items.length > 0) {
        const productIds = items.map((item) => item.productId);
        const productsData = await tx
          .select()
          .from(products)
          .where(and(...productIds.map((id) => eq(products.id, id))));

        const productMap = new Map(productsData.map((p) => [p.id, p]));

        for (const item of items) {
          const [inventoryRecord] = await tx
            .select()
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

          const product = productMap.get(item.productId);
          if (product?.isBattery) {
            continue;
          }

          if (product?.productType === "lubricant" || item.volumeDescription) {
            await tx
              .update(inventory)
              .set({
                closedBottlesStock: (inventoryRecord.closedBottlesStock ?? 0) + item.quantity,
              })
              .where(eq(inventory.id, inventoryRecord.id));
          } else {
            await tx
              .update(inventory)
              .set({
                standardStock: (inventoryRecord.standardStock ?? 0) + item.quantity,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
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
