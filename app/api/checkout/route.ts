import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getDatabase,
  isDatabaseAvailable,
  getDatabaseHealth,
  testDatabaseConnection,
} from "@/lib/db/client";
import { shops } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  CheckoutInputSchema,
  calculateFinalTotal,
} from "@/lib/types/checkout";
import type { CheckoutInput } from "@/lib/types/checkout";

// Helper functions removed - logic moved to database stored procedure


export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    if (!req.body) {
      return NextResponse.json({ success: false, error: "Request body is required" }, { status: 400 });
    }
    
    // Check database availability
    if (!isDatabaseAvailable()) {
       void testDatabaseConnection(); // Try to reconnect
       if (!isDatabaseAvailable()) { // Double check
          return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
       }
    }

    const db = getDatabase();
    const body = await req.json();

    // Validate Input
    let validatedInput;
    try {
      validatedInput = CheckoutInputSchema.parse(body);
    } catch (error) {
       return NextResponse.json({ success: false, error: "Invalid input", details: error }, { status: 400 });
    }

    const {
      locationId,
      shopId,
      paymentMethod,
      cashierId: cashierIdInput,
      cart,
      tradeIns,
      discount,
      carPlateNumber,
      customerId,
      mobilePaymentAccount,
      mobileNumber,
    } = validatedInput;

    // Validate Cashier
    let cashierId: string | undefined = cashierIdInput;
    if (cashierId && cashierId !== "default-cashier" && cashierId !== "on-hold-system") {
      const { getStaffUuidById } = await import("@/lib/utils/staff-validation");
      const staffUuid = await getStaffUuidById(cashierId);
      if (!staffUuid) {
        return NextResponse.json({ success: false, error: "Invalid cashier ID" }, { status: 400 });
      }
      cashierId = staffUuid;
    }

    // Process Cart
    if (!cart || cart.length === 0) {
      return NextResponse.json({ success: false, error: "Cart cannot be empty" }, { status: 400 });
    }

    // Pre-process Cart (ensure sources)
    const processedCart = cart.map((item) => ({
      ...item,
      source: item.source || "CLOSED",
    }));

    // Calculate Totals
    const {
      subtotalBeforeDiscount,
      discountAmount,
      finalTotal,
    } = calculateFinalTotal(cart, tradeIns, discount);

    // Determine Location (Lookup logic)
    let actualLocationId = locationId;
    if (shopId && shopId !== locationId) {
       const [shopData] = await db
        .select({ locationId: shops.locationId })
        .from(shops)
        .where(eq(shops.id, shopId))
        .limit(1);
       if (shopData) {
         actualLocationId = shopData.locationId;
       } else {
         return NextResponse.json({ success: false, error: `Shop ${shopId} not found` }, { status: 400 });
       }
    }

    // Determine Transaction Type
    let transactionType = "SALE";
    if (paymentMethod.toLowerCase() === "credit") transactionType = "CREDIT";
    else if (paymentMethod.toUpperCase() === "ON_HOLD" || paymentMethod.toLowerCase() === "on hold") transactionType = "ON_HOLD";

    // Call Database Stored Procedure
    // Note: We are now executing the ENTIRE logic in one DB call
    // p_items must be JSONB
    // p_shop_id must be UUID
    
    // Convert cart to strictly serializable object
    const cartJson = JSON.stringify(processedCart);

    const result = await db.execute(sql`
      SELECT create_checkout_transaction(
        ${actualLocationId}::uuid,
        ${shopId}::uuid,
        ${cashierId || null}::uuid,
        ${cartJson}::jsonb,
        ${finalTotal.toString()}::numeric,
        ${paymentMethod}::text,
        ${transactionType}::text,
        ${customerId || null}::uuid,
        ${discount ? discount.value.toString() : null}::numeric,
        ${discount ? discount.type : null}::text,
        ${discountAmount.toString()}::numeric,
        ${subtotalBeforeDiscount.toString()}::numeric,
        ${carPlateNumber || null}::text,
        ${paymentMethod?.toUpperCase() === "MOBILE" ? mobilePaymentAccount : null}::text,
        ${paymentMethod?.toUpperCase() === "MOBILE" ? mobileNumber : null}::text,
        null::text,
        ${JSON.stringify(tradeIns || [])}::jsonb
      ) as data
    `);

    // The result comes back as [{ data: { transaction_id: ..., reference_number: ... } }]
    // Drizzle/Postgres returns array of rows. 
    if (!result || result.length === 0 || !result[0].data) {
       throw new Error("Database transaction returned no result");
    }

    const transactionData = result[0].data as any;

    const processingTime = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      data: {
        transaction: {
            id: transactionData.transaction_id,
            referenceNumber: transactionData.reference_number,
            // Mock other fields that frontend might expect somewhat?
            // Actually frontend mainly needs ref number and success.
            // But let's be safe and return what we have.
            totalAmount: finalTotal.toString(),
            itemsSold: processedCart,
            // ...
        },
        requestId,
        processingTime,
      },
    });

  } catch (error: any) {
    console.error("Checkout Error:", error);
    // Mimic previous error handling structure
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown Error",
      details: { requestId, error },
    }, { status: 500 });
  }
}