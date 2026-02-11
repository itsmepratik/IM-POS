import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getDatabase,
  isDatabaseAvailable,
  getDatabaseHealth,
  testDatabaseConnection,
} from "@/lib/db/client";
import { shops, inventory, products, batches } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  CheckoutInputSchema,
  calculateFinalTotal,
} from "@/lib/types/checkout";
import type { CheckoutInput } from "@/lib/types/checkout";

// Helper functions removed - logic moved to database stored procedure


const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    if (!req.body) {
      return NextResponse.json({ success: false, error: "Request body is required" }, { status: 400 });
    }
    
    // Check database availability - CRITICAL FIX: await the test
    if (!isDatabaseAvailable()) {
       await testDatabaseConnection(); // Wait for it!
       if (!isDatabaseAvailable()) { // Double check
          console.error(`[${requestId}] Database still unavailable after test.`);
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

    // RETRY LOOP FOR DB OPERATION
    let lastError: any;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 1) {
            await delay(RETRY_DELAY * attempt);
        }

        // Call Database Stored Procedure
        // Note: We are now executing the ENTIRE logic in one DB call
        // p_items must be JSONB
        // p_shop_id must be UUID
        
        // convert cart items to map for efficient lookup
        const productIds = processedCart.map(i => i.productId);
        // Filter for valid UUIDs only to prevent DB errors with "9999" (Labor Charge)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validProductIds = productIds.filter(id => uuidRegex.test(id));
        
        // Fetch critical data for cost calculation:
        // 1. Products (for base Cost Price and Category)
        // 2. Active Batches (for FIFO/Active Batch Cost Price)
        // 3. Product Volumes (for Lubricant Max Volume inference)
        
        // 1. Fetch Products
        // Only query if we have valid UUIDs
        const productsData = validProductIds.length > 0 ? await db.query.products.findMany({
          where: (products, { inArray }) => inArray(products.id, validProductIds),
          with: {
            category: true, // to check if fluid
          }
        }) : [];
        
        // 2. Fetch Inventory for these products (EXPLICIT - not subquery)
        const inventoryData = validProductIds.length > 0 ? await db.select().from(inventory).where(
          sql`${inventory.productId} IN (${sql.join(validProductIds.map(id => sql`${id}::uuid`), sql`, `)})`
        ) : [];

        const inventoryMap = new Map<string, string>(); // inventoryId -> productId
        const inventoryIds = inventoryData.map(inv => {
            inventoryMap.set(inv.id, inv.productId);
            return inv.id;
        });

        // 3. Fetch Batches for those inventory records (EXPLICIT - not subquery)
        let activeBatchesData: any[] = [];
        if (inventoryIds.length > 0) {
            const allBatches = await db.execute(sql`
                SELECT * FROM batches 
                WHERE inventory_id IN (${sql.join(inventoryIds.map(id => sql`${id}::uuid`), sql`, `)})
                ORDER BY is_active_batch DESC, purchase_date DESC
            `);
            activeBatchesData = (allBatches as any[]).map(b => ({
                ...b,
                inventoryProductId: inventoryMap.get(b.inventory_id) // Attach productId for easy lookup
            }));
        }

        // 4. Fetch Product Volumes (only for fluids needed really, but easier to fetch all matching products)
        // Use validProductIds
        const productVolumesData = validProductIds.length > 0 ? await db.query.productVolumes.findMany({
          where: (volumes, { inArray }) => inArray(volumes.productId, validProductIds),
        }) : [];

        const { calculateItemCost, resolveCostPrice } = await import("@/lib/utils/cost-calc");


        // Enhance Cart with Cost Price
        const cartWithCost = processedCart.map(item => {
          const product = productsData.find(p => p.id === item.productId);
          if (!product) return item; // Should be caught by validation really

          // Find best batch for this product (active > latest)
          const batchForProduct = activeBatchesData.find(b => b.inventoryProductId === item.productId);
          
          // Use centralized cost resolution with batch-first priority
          const { cost: baseCost, source: costSource } = resolveCostPrice({
            activeBatchCost: batchForProduct?.cost_price,
            productCost: product.costPrice,
            productName: product.name
          });
          
          // Robust isFluid check using includes()
          const catName = product.category?.name?.toLowerCase() || "";
          const isFluid = catName.includes('fluid') || catName.includes('oil') || catName.includes('lubricant');
          
          const allVolumeDescriptions = productVolumesData
            .filter(v => v.productId === item.productId)
            .map(v => v.volumeDescription);

          const costPrice = calculateItemCost({
            baseCost,
            isFluid,
            itemVolume: item.volumeDescription,
            allVolumeDescriptions
          });

          return {
            ...item,
            costPrice,
            // Persist strict snapshot data
            batchId: batchForProduct?.id,
            originalBaseCost: baseCost,
            costSource // Track where cost came from for debugging
          };

        });

        // Convert enhanced cart to strictly serializable object
        const cartJson = JSON.stringify(cartWithCost);
        
        // Execute the main transaction
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
            ${(paymentMethod?.toUpperCase() === "MOBILE" && mobilePaymentAccount) ? mobilePaymentAccount : null}::text,
            ${(paymentMethod?.toUpperCase() === "MOBILE" && mobileNumber) ? mobileNumber : null}::text,
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
                totalAmount: finalTotal.toString(),
                itemsSold: processedCart,
            },
            requestId,
            processingTime,
          },
        });
        
      } catch (e: any) {
        console.error(`[${requestId}] Error attempt ${attempt}:`, e);
        lastError = e;
        
        // If it's not a connection error, don't retry, just fail
        const isConnectionError = 
            e.message?.includes("connection") || 
            e.message?.includes("timeout") || 
            e.message?.includes("ETIMEDOUT") || 
            e.message?.includes("ECONNRESET") || 
            e.code === "57P01" || // admin_shutdown
            e.code === "57P03";   // cannot_connect_now
            
        if (!isConnectionError) {
             break; // Logical error, don't retry
        }
        
        // Connection error: explicitly try to fix connection before next retry
        try {
            await testDatabaseConnection(); 
        } catch (connErr) {
            console.error(`[${requestId}] Failed to reconnect during retry:`, connErr);
        }
      }
    }

    // If we're here, all retries failed
    throw lastError;

  } catch (error: any) {
    console.error("Checkout Error (Final):", error);
    // Mimic previous error handling structure
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown Error",
      details: { requestId, error },
    }, { status: 500 });
  }
}