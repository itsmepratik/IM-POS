import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { transactions, inventory, products } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  DisputeInputSchema,
  calculateDisputeTotal,
  isBatteryDispute,
} from "@/lib/types/dispute";
import { generateReferenceNumber } from "@/lib/utils/reference-numbers";

import type { DisputeInput } from "@/lib/types/dispute";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedInput = DisputeInputSchema.parse(body);
    const {
      originalBillNumber,
      disputeType,
      locationId,
      shopId,
      cashierId,
      disputedItems,
    } = validatedInput;

    // Validate cashier/staff ID and convert to UUID
    const { getStaffUuidById } = await import("@/lib/utils/staff-validation");
    const staffUuid = await getStaffUuidById(cashierId);
    
    if (!staffUuid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cashier ID",
          details: `No active staff member found with ID: ${cashierId}`,
        },
        { status: 400 }
      );
    }

    // Perform all operations in a single database transaction
    const result = await db.transaction(async (tx) => {
      // 1. Fetch & Validate original transaction
      const [originalTransaction] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.referenceNumber, originalBillNumber))
        .limit(1);

      if (!originalTransaction) {
        throw new Error(
          `Original transaction with bill number ${originalBillNumber} not found`
        );
      }

      // Validate that the original transaction is a sale
      if (originalTransaction.type !== "SALE") {
        throw new Error(
          `Cannot dispute non-sale transaction. Original transaction type: ${originalTransaction.type}`
        );
      }

      // 2. Fetch product information for disputed items
      const productIds = disputedItems.map((item) => item.productId);
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

      // Validate that all disputed products exist
      for (const item of disputedItems) {
        if (!productMap.has(item.productId)) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }
      }

      // 3. Check if dispute is for battery items
      const isBattery = isBatteryDispute(disputedItems);

      // 4. Generate sequential dispute reference number
      // WARRANTY_CLAIM uses WBX prefix, REFUND uses A prefix (regular transaction)
      const disputeReferenceNumber = await generateReferenceNumber(
        disputeType,
        isBattery,
        disputeType === "REFUND" ? "CASH" : "WARRANTY_CLAIM"
      );
      const totalAmount = calculateDisputeTotal(disputedItems, disputeType);

      // 5. Create dispute transaction record
      const [disputeTransaction] = await tx
        .insert(transactions)
        .values({
          referenceNumber: disputeReferenceNumber,
          locationId,
          shopId,
          cashierId: staffUuid, // Use UUID instead of staff_id text
          type: disputeType,
          totalAmount: totalAmount.toString(),
          itemsSold: disputedItems,
          originalReferenceNumber: originalBillNumber,
        })
        .returning();

      // 5. Perform conditional inventory updates
      if (disputeType === "REFUND") {
        for (const disputedItem of disputedItems) {
          // Find inventory record for the disputed product
          const [inventoryRecord] = await tx
            .select()
            .from(inventory)
            .where(
              and(
                eq(inventory.productId, disputedItem.productId),
                eq(inventory.locationId, locationId)
              )
            )
            .limit(1);

          if (!inventoryRecord) {
            throw new Error(
              `Inventory not found for product ${disputedItem.productId} at location ${locationId}`
            );
          }

          // Get product information to determine type
          const product = productMap.get(disputedItem.productId);

          if (product?.productType === "lubricant") {
            // For lubricants, increment closed bottles stock
            await tx
              .update(inventory)
              .set({
                closedBottlesStock:
                  inventoryRecord.closedBottlesStock + disputedItem.quantity,
              })
              .where(eq(inventory.id, inventoryRecord.id));
          } else {
            // For standard products (including battery trade-in types), increment standard stock
            await tx
              .update(inventory)
              .set({
                standardStock:
                  inventoryRecord.standardStock + disputedItem.quantity,
              })
              .where(eq(inventory.id, inventoryRecord.id));
          }
        }
      }
      // Note: For WARRANTY_CLAIM, no inventory changes are made

      return {
        disputeTransaction: {
          ...disputeTransaction,
        },
        originalTransaction,
        isBattery,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `${result.disputeTransaction.type} processed successfully. Reference: ${result.disputeTransaction.referenceNumber}`,
    });
  } catch (error) {
    console.error("Dispute processing error:", error);

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
          error instanceof Error
            ? error.message
            : "Unknown error occurred during dispute processing",
      },
      { status: 500 }
    );
  }
}
