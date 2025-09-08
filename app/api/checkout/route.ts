import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import {
  transactions,
  tradeInTransactions,
  inventory,
  batches,
  products,
  locations,
} from "@/lib/db/schema";
import { eq, asc, and, inArray, gt } from "drizzle-orm";
import {
  CheckoutInputSchema,
  generateReferenceNumber,
  calculateFinalTotal,
} from "@/lib/types/checkout";
import {
  generateThermalReceipt,
  generateBatteryBill,
  formatDate,
  formatTime,
  ReceiptData,
} from "@/lib/utils/receipts";
import type { CheckoutInput } from "@/lib/types/checkout";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedInput = CheckoutInputSchema.parse(body);
    const { locationId, shopId, paymentMethod, cashierId, cart, tradeIns } =
      validatedInput;

    // Generate reference number
    const referenceNumber = generateReferenceNumber();

    // Calculate total amount
    const totalAmount = calculateFinalTotal(cart, tradeIns);

    // Perform all operations in a single transaction
    const result = await db.transaction(async (tx) => {
      // 1. Fetch product names for receipt generation
      const productIds = [
        ...cart.map((item) => item.productId),
        ...(tradeIns?.map((ti) => ti.productId) || []),
      ];
      const productMap = new Map();

      if (productIds.length > 0) {
        const productsData = await tx
          .select()
          .from(products)
          .where(inArray(products.id, productIds));

        productsData.forEach((product) => {
          productMap.set(product.id, product);
        });
      }

      // 2. Create transaction record
      const [newTransaction] = await tx
        .insert(transactions)
        .values({
          referenceNumber,
          locationId,
          shopId,
          cashierId,
          type: "SALE",
          totalAmount: totalAmount.toString(),
          itemsSold: cart,
          paymentMethod,
        })
        .returning();

      // 2. Process each cart item with FIFO logic
      for (const cartItem of cart) {
        // Find inventory record
        const [inventoryRecord] = await tx
          .select()
          .from(inventory)
          .where(
            and(
              eq(inventory.productId, cartItem.productId),
              eq(inventory.locationId, locationId)
            )
          )
          .limit(1);

        if (!inventoryRecord) {
          throw new Error(
            `Inventory not found for product ${cartItem.productId} at location ${locationId}`
          );
        }

        // Find the active batch (FIFO - oldest first)
        const [activeBatch] = await tx
          .select()
          .from(batches)
          .where(
            and(
              eq(batches.inventoryId, inventoryRecord.id),
              eq(batches.isActiveBatch, true)
            )
          )
          .orderBy(asc(batches.purchaseDate))
          .limit(1);

        if (!activeBatch) {
          throw new Error(
            `No active batch found for inventory ${inventoryRecord.id}`
          );
        }

        // Check if we have enough stock in the active batch
        if (activeBatch.stockRemaining < cartItem.quantity) {
          throw new Error(
            `Insufficient stock in active batch ${activeBatch.id}. Available: ${activeBatch.stockRemaining}, Required: ${cartItem.quantity}`
          );
        }

        // Decrement stock from active batch
        await tx
          .update(batches)
          .set({
            stockRemaining: activeBatch.stockRemaining - cartItem.quantity,
          })
          .where(eq(batches.id, activeBatch.id));

        // FIFO Rule: If depleting the active batch, deactivate it and activate next oldest
        if (activeBatch.stockRemaining - cartItem.quantity === 0) {
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

        // Update inventory stock based on product type
        const product = await tx
          .select()
          .from(products)
          .where(eq(products.id, cartItem.productId))
          .limit(1);

        if (product[0]?.productType === "lubricant") {
          // For lubricants, prioritize closed bottles
          if (inventoryRecord.closedBottlesStock >= cartItem.quantity) {
            await tx
              .update(inventory)
              .set({
                closedBottlesStock:
                  inventoryRecord.closedBottlesStock - cartItem.quantity,
              })
              .where(eq(inventory.id, inventoryRecord.id));
          } else {
            // Use remaining closed bottles and then open bottles
            const remainingFromClosed = inventoryRecord.closedBottlesStock;
            const remainingFromOpen = cartItem.quantity - remainingFromClosed;

            await tx
              .update(inventory)
              .set({
                closedBottlesStock: 0,
                openBottlesStock:
                  inventoryRecord.openBottlesStock - remainingFromOpen,
              })
              .where(eq(inventory.id, inventoryRecord.id));
          }
        } else {
          // For other products, decrement standard stock
          await tx
            .update(inventory)
            .set({
              standardStock: inventoryRecord.standardStock - cartItem.quantity,
            })
            .where(eq(inventory.id, inventoryRecord.id));
        }
      }

      // 3. Handle trade-ins if present
      if (tradeIns && tradeIns.length > 0) {
        for (const tradeIn of tradeIns) {
          // Create trade-in transaction record
          await tx.insert(tradeInTransactions).values({
            transactionId: newTransaction.id,
            productId: tradeIn.productId,
            quantity: tradeIn.quantity,
            tradeInValue: tradeIn.tradeInValue.toString(),
          });

          // Find inventory record for trade-in product
          const [tradeInInventory] = await tx
            .select()
            .from(inventory)
            .where(
              and(
                eq(inventory.productId, tradeIn.productId),
                eq(inventory.locationId, locationId)
              )
            )
            .limit(1);

          if (tradeInInventory) {
            // Increment standard stock for trade-in product
            await tx
              .update(inventory)
              .set({
                standardStock:
                  tradeInInventory.standardStock + tradeIn.quantity,
              })
              .where(eq(inventory.id, tradeInInventory.id));
          }
        }
      }

      // 4. Generate receipts
      const now = new Date();
      const receiptData: ReceiptData = {
        referenceNumber: newTransaction.referenceNumber,
        totalAmount: newTransaction.totalAmount,
        paymentMethod: paymentMethod,
        items: cart.map((item) => {
          const product = productMap.get(item.productId);
          return {
            name: product?.name || `Product ${item.productId}`,
            quantity: item.quantity,
            sellingPrice: item.sellingPrice,
            volumeDescription: item.volumeDescription,
          };
        }),
        tradeIns: tradeIns?.map((tradeIn) => {
          const product = productMap.get(tradeIn.productId);
          return {
            name: product?.name || `Trade-in ${tradeIn.productId}`,
            quantity: tradeIn.quantity,
            tradeInValue: tradeIn.tradeInValue,
          };
        }),
        date: formatDate(now),
        time: formatTime(now),
      };

      const isBattery = cart.some((item) =>
        item.volumeDescription?.toLowerCase().includes("battery")
      );

      let receiptHtml = "";
      let batteryBillHtml = "";

      if (isBattery) {
        batteryBillHtml = generateBatteryBill(receiptData);
      } else {
        receiptHtml = generateThermalReceipt(receiptData);
      }

      // Update transaction with receipt HTML
      await tx
        .update(transactions)
        .set({
          receiptHtml: receiptHtml || null,
          batteryBillHtml: batteryBillHtml || null,
        })
        .where(eq(transactions.id, newTransaction.id));

      return {
        transaction: newTransaction,
        receiptHtml,
        batteryBillHtml,
        isBattery,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Checkout error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

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
