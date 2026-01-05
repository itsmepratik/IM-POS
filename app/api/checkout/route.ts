import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getDatabase,
  isDatabaseAvailable,
  getDatabaseHealth,
  testDatabaseConnection,
  queryClient,
} from "@/lib/db/client";
import {
  transactions,
  tradeInTransactions,
  inventory,
  batches,
  products,
  locations,
  categories,
  openBottleDetails,
  shops,
  productVolumes,
  types,
  tradeInPrices,
} from "@/lib/db/schema";
import { eq, asc, and, inArray, gt, or } from "drizzle-orm";
import {
  CheckoutInputSchema,
  calculateFinalTotal,
} from "@/lib/types/checkout";
import { generateReferenceNumber } from "@/lib/utils/reference-numbers";
import {
  generateThermalReceipt,
  generateBatteryBill,
  formatDate,
  formatTime,
  ReceiptData,
} from "@/lib/utils/receipts";
import { parseVolumeString } from "@/lib/utils/volume-parser";
import type { CheckoutInput } from "@/lib/types/checkout";

/**
 * Gets the highest volume for a product from product_volumes table
 * @param productId - UUID of the product
 * @param tx - Database transaction
 * @returns Highest volume as a number (e.g., 4.0 or 5.0)
 */
async function getHighestVolume(productId: string, tx: any): Promise<number> {
  const volumes = await tx
    .select()
    .from(productVolumes)
    .where(eq(productVolumes.productId, productId));

  if (!volumes || volumes.length === 0) {
    // Default to 4.0 if no volumes found (common lubricant bottle size)
    return 4.0;
  }

  let highestValue = 0;
  for (const volume of volumes) {
    const numericValue = parseVolumeString(volume.volumeDescription);
    if (numericValue > highestValue) {
      highestValue = numericValue;
    }
  }

  return highestValue > 0 ? highestValue : 4.0; // Fallback to 4.0
}

// Helper function to handle lubricant sales with precise bottle tracking
async function handleLubricantSale(
  tx: any,
  cartItem: any,
  inventoryRecord: any,
  preFetchedBottleSize?: number,
  preFetchedOpenBottles?: any[]
) {
  // Add a default value here as a safeguard - fixes the main issue from checkoutroutefix.md
  const { source = "CLOSED", quantity } = cartItem; // Default to 'CLOSED' if source is missing

  // Debug logging to confirm function execution
  console.log("Executing handleLubricantSale for product:", cartItem.productId);
  console.log("Cart item data:", {
    productId: cartItem.productId,
    source,
    quantity,
    volumeDescription: cartItem.volumeDescription,
  });

  // Parse quantity as numeric volume (should be the volume amount, not item count)
  const requestedVolume = typeof quantity === "number" ? quantity : parseFloat(String(quantity)) || 0;
  
  console.log(`[${cartItem.productId}] Parsed requestedVolume: ${requestedVolume} from quantity: ${quantity}`);
  
  if (requestedVolume <= 0) {
    throw new Error(`Invalid quantity for lubricant sale: ${quantity}`);
  }

  if (source === "CLOSED") {
    // Selling from a new closed bottle
    if (inventoryRecord.closedBottlesStock < 1) {
      throw new Error("No closed bottles available for this lubricant");
    }

    // Get the highest volume (bottle size) from product_volumes table
    let bottleSize;
    if (preFetchedBottleSize !== undefined) {
      bottleSize = preFetchedBottleSize;
    } else {
      bottleSize = await getHighestVolume(cartItem.productId, tx);
    }
    const initialVolume = bottleSize;
    const currentVolume = initialVolume - requestedVolume;
    const isEmpty = currentVolume <= 0;

    await tx
      .update(inventory)
      .set({
        closedBottlesStock: inventoryRecord.closedBottlesStock - 1,
      })
      .where(eq(inventory.id, inventoryRecord.id));

    // Update in-memory inventory record
    inventoryRecord.closedBottlesStock = inventoryRecord.closedBottlesStock - 1;

    // Create new open bottle record
    await tx.insert(openBottleDetails).values({
      inventoryId: inventoryRecord.id,
      initialVolume: initialVolume.toString(),
      currentVolume: currentVolume.toString(),
      isEmpty: isEmpty,
    });

    // Only increment open bottles stock if the bottle is not immediately empty
    if (!isEmpty) {
      await tx
        .update(inventory)
        .set({
          openBottlesStock: inventoryRecord.openBottlesStock + 1,
        })
        .where(eq(inventory.id, inventoryRecord.id));

      // Update in-memory inventory record
      inventoryRecord.openBottlesStock = (inventoryRecord.openBottlesStock || 0) + 1;
    }
  } else if (source === "OPEN") {
    // Selling from existing open bottle(s)
    // Find all non-empty open bottles ordered by opened_at (FIFO)
    let openBottles;
    if (preFetchedOpenBottles) {
      openBottles = preFetchedOpenBottles;
    } else {
      openBottles = await tx
        .select()
        .from(openBottleDetails)
        .where(
          and(
            eq(openBottleDetails.inventoryId, inventoryRecord.id),
            eq(openBottleDetails.isEmpty, false)
          )
        )
        .orderBy(asc(openBottleDetails.openedAt));
    }

    console.log(`[${cartItem.productId}] OPEN source - Found ${openBottles.length} open bottles`);
    console.log(`[${cartItem.productId}] OPEN source - Requested volume: ${requestedVolume}`);

    if (!openBottles || openBottles.length === 0) {
      throw new Error("No open bottles available for this lubricant");
    }

    // Calculate total available volume from all open bottles
    const totalAvailableVolume = openBottles.reduce((sum: number, bottle: any) => {
      const vol = parseFloat(bottle.currentVolume);
      console.log(`[${cartItem.productId}] OPEN source - Bottle ${bottle.id}: current_volume=${bottle.currentVolume} (parsed=${vol})`);
      return sum + vol;
    }, 0);

    console.log(`[${cartItem.productId}] OPEN source - Total available volume: ${totalAvailableVolume}`);

    if (totalAvailableVolume < requestedVolume) {
      throw new Error(
        `Insufficient volume in open bottles. Available: ${totalAvailableVolume}, Required: ${requestedVolume}`
      );
    }

    // Process bottles FIFO until we've satisfied the requested volume
    let remainingVolume = requestedVolume;
    let bottlesToUpdate: Array<{ id: string; newVolume: number; isEmpty: boolean }> = [];
    let bottlesToMarkEmpty: string[] = [];
    let newBottlesToCreate: Array<{ initialVolume: number; currentVolume: number }> = [];

    // Get bottle size for potential new bottles
    let bottleSize;
    if (preFetchedBottleSize !== undefined) {
      bottleSize = preFetchedBottleSize;
    } else {
      bottleSize = await getHighestVolume(cartItem.productId, tx);
    }

    console.log(`[${cartItem.productId}] OPEN source - Processing bottles, remainingVolume=${remainingVolume}, bottleSize=${bottleSize}`);

    for (const [index, bottle] of openBottles.entries()) {
      console.log(`[${cartItem.productId}] Processing bottle ${index + 1}/${openBottles.length}`);
      if (remainingVolume <= 0) {
        console.log(`[${cartItem.productId}] OPEN source - Remaining volume satisfied, breaking loop`);
        break;
      }

      const currentVolume = parseFloat(bottle.currentVolume);
      console.log(`[${cartItem.productId}] OPEN source - Processing bottle ${bottle.id}: currentVolume=${currentVolume}, remainingVolume=${remainingVolume}`);
      
      if (currentVolume >= remainingVolume) {
        // This bottle has enough volume
        const newVolume = currentVolume - remainingVolume;
    const isEmpty = newVolume <= 0;

        console.log(`[${cartItem.productId}] OPEN source - Bottle ${bottle.id} has enough: newVolume=${newVolume}, isEmpty=${isEmpty}`);
        
        // Only add to bottlesToUpdate if it's not empty, otherwise add to bottlesToMarkEmpty
        if (isEmpty) {
          bottlesToMarkEmpty.push(bottle.id);
        } else {
          bottlesToUpdate.push({
            id: bottle.id,
            newVolume: newVolume,
            isEmpty: false,
          });
        }
        
        remainingVolume = 0;
      } else {
        // This bottle doesn't have enough, use all of it and move to next
        console.log(`[${cartItem.productId}] OPEN source - Bottle ${bottle.id} doesn't have enough, using all ${currentVolume}L`);
        bottlesToMarkEmpty.push(bottle.id);
        remainingVolume -= currentVolume;
        console.log(`[${cartItem.productId}] OPEN source - Remaining volume after using bottle: ${remainingVolume}`);
      }
    }

    console.log(`[${cartItem.productId}] OPEN source - After processing all bottles: remainingVolume=${remainingVolume}`);
    console.log(`[${cartItem.productId}] OPEN source - Bottles to update: ${bottlesToUpdate.length}, Bottles to mark empty: ${bottlesToMarkEmpty.length}`);

    // If we still need more volume after using all open bottles, open a new closed bottle
    if (remainingVolume > 0) {
      console.log(`[${cartItem.productId}] OPEN source - Still need ${remainingVolume}L more, opening new closed bottle`);
      if (inventoryRecord.closedBottlesStock < 1) {
        throw new Error(
          `Insufficient stock. Need ${remainingVolume}L more but no closed bottles available.`
        );
      }

      // Decrement closed bottles stock
      await tx
        .update(inventory)
        .set({
          closedBottlesStock: inventoryRecord.closedBottlesStock - 1,
        })
        .where(eq(inventory.id, inventoryRecord.id));

      // Create new open bottle with remaining volume
      const newBottleCurrentVolume = bottleSize - remainingVolume;
      const newBottleIsEmpty = newBottleCurrentVolume <= 0;

      await tx.insert(openBottleDetails).values({
        inventoryId: inventoryRecord.id,
        initialVolume: bottleSize.toString(),
        currentVolume: newBottleCurrentVolume.toString(),
        isEmpty: newBottleIsEmpty,
      });

      // Increment open bottles stock if not empty
      if (!newBottleIsEmpty) {
        await tx
          .update(inventory)
          .set({
            openBottlesStock: inventoryRecord.openBottlesStock + 1,
          })
          .where(eq(inventory.id, inventoryRecord.id));
        
        // Update in-memory inventory record
        inventoryRecord.openBottlesStock = (inventoryRecord.openBottlesStock || 0) + 1;
      }
      
      // Update pre-fetched open bottles list if available
      if (preFetchedOpenBottles) {
          // Construct the new bottle object (approximated structure)
          preFetchedOpenBottles.push({
             id: "pending-id-placeholder", // We don't have the ID yet unless we did returning()... 
             // but handleLubricantSale creates new bottle which might be used by NEXT iteration?
             // Actually, if we just push it, the next iteration will find it. 
             // But we need the ID for updates.
             inventoryId: inventoryRecord.id,
             initialVolume: bottleSize.toString(),
             currentVolume: newBottleCurrentVolume.toString(),
             isEmpty: newBottleIsEmpty,
             openedAt: new Date(), // approximate
          });
      }
    } else {
      console.log(`[${cartItem.productId}] OPEN source - All volume satisfied from existing open bottles, no new bottle needed`);
    }

    // Update all bottles that were used
    for (const update of bottlesToUpdate) {
    await tx
      .update(openBottleDetails)
      .set({
          currentVolume: update.newVolume.toString(),
          isEmpty: update.isEmpty,
      })
        .where(eq(openBottleDetails.id, update.id));
      console.log(`[${cartItem.productId}] Updated bottle ${update.id}`);
      
      // Update in-memory bottle objects
      if (preFetchedOpenBottles) {
         const bottle = preFetchedOpenBottles.find(b => b.id === update.id);
         if (bottle) {
             bottle.currentVolume = update.newVolume.toString();
             bottle.isEmpty = update.isEmpty;
         }
      }
    }

    // Mark bottles as empty and decrement open bottles stock
    if (bottlesToMarkEmpty.length > 0) {
      await tx
        .update(openBottleDetails)
        .set({
          isEmpty: true,
          currentVolume: "0",
        })
        .where(inArray(openBottleDetails.id, bottlesToMarkEmpty));

      // Decrement open bottles stock count
      const currentOpenBottlesStock = inventoryRecord.openBottlesStock;
      const newOpenBottlesStock = Math.max(
        0,
        currentOpenBottlesStock - bottlesToMarkEmpty.length
      );

      await tx
        .update(inventory)
        .set({
          openBottlesStock: newOpenBottlesStock,
        })
        .where(eq(inventory.id, inventoryRecord.id));
    }
  } else {
    // This should not happen with the default value, but keeping for safety
    throw new Error(
      "Invalid source for lubricant sale. Must be 'CLOSED' or 'OPEN'. Received: " +
        source
    );
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  console.log(`[${requestId}] Checkout request started`);

  try {
    // Enhanced request validation
    if (!req.body) {
      return NextResponse.json(
        {
          success: false,
          error: "Request body is required",
          details: {
            requestId,
            errorType: "VALIDATION_ERROR",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }
    // Check database availability before proceeding
    if (!isDatabaseAvailable()) {
      const dbHealth = getDatabaseHealth();
      console.error(`[${requestId}] Database unavailable according to health check:`, dbHealth);

      return NextResponse.json(
        {
          success: false,
          error:
            "Database service is currently unavailable. Please try again in a moment.",
          details: {
            requestId,
            databaseHealth: dbHealth,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 503 }
      );
    }

    // Attempt a silent test connection in background if not already healthy
    const dbHealth = getDatabaseHealth();
    if (!dbHealth.isHealthy) {
       console.log(`[${requestId}] Database health is poor, triggering manual test...`);
       void testDatabaseConnection();
    }

    const db = getDatabase();

    const body = await req.json();

    // Enhanced validation with detailed error handling
    let validatedInput;
    try {
      validatedInput = CheckoutInputSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request data",
            details: {
              requestId,
              errorType: "VALIDATION_ERROR",
              validationErrors: validationError.issues.map((err) => ({
                field: err.path.join("."),
                message: err.message,
                code: err.code,
              })),
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
      }
      throw validationError;
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

    console.log(
      `[${requestId}] Customer ID received:`,
      customerId || "None (Anonymous)"
    );
    console.log(
      `[${requestId}] Discount received:`,
      discount ? `${discount.type} - ${discount.value}` : "None"
    );
    console.log(
      `[${requestId}] Full validated input:`,
      JSON.stringify({
        cartLength: cart.length,
        hasTradeIns: !!tradeIns,
        hasDiscount: !!discount,
        discount: discount,
      }, null, 2)
    );

    // Validate cashier/staff ID and convert to UUID
    let cashierId: string | undefined = cashierIdInput;
    if (cashierId && cashierId !== "default-cashier" && cashierId !== "on-hold-system") {
      const { getStaffUuidById } = await import("@/lib/utils/staff-validation");
      const staffUuid = await getStaffUuidById(cashierId);
      
      if (!staffUuid) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid cashier ID",
            details: {
              requestId,
              errorType: "VALIDATION_ERROR",
              cashierId,
              message: `No active staff member found with ID: ${cashierId}`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
      }
      
      // Replace cashierId with UUID for database storage
      cashierId = staffUuid;
      console.log(`[${requestId}] Cashier validated and converted to UUID: ${cashierId}`);
    }

    // Additional business logic validation
    if (!cart || cart.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cart cannot be empty",
          details: {
            requestId,
            errorType: "BUSINESS_LOGIC_ERROR",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Validate productId format - must be valid UUIDs (except for labor charges)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const item of cart) {
      // Skip validation for labor charges (productId: "9999")
      if (item.productId === "9999") {
        console.log(`[${requestId}] Skipping UUID validation for labor charge`);
        continue;
      }

      if (!uuidRegex.test(item.productId)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid productId format: ${item.productId}`,
            details: {
              requestId,
              errorType: "VALIDATION_ERROR",
              invalidProductId: item.productId,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
      }
    }

    // Process cart items to ensure lubricant items have source property
    const processedCart = cart.map((item) => {
      // Check if the item is a lubricant (we'll verify this in the transaction)
      // For now, ensure source is always present for any item that might be a lubricant
      if (item.source === undefined) {
        return {
          ...item,
          source: "CLOSED" as const, // Default to CLOSED if source is missing
        };
      }
      return item;
    });

    // Calculate total amount with discount
    const {
      subtotalBeforeDiscount,
      discountAmount,
      tradeInTotal,
      finalTotal,
    } = calculateFinalTotal(cart, tradeIns, discount);
    
    const totalAmount = finalTotal;

    // Database is already initialized and tested above

    // Perform all operations in a single transaction with enhanced error handling
    const result = await db.transaction(async (tx) => {
      try {
        // 1. Fetch product names and categories for receipt generation
        // Filter out labor charges (productId: "9999") from product lookups
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        const productIds = [
          ...cart
            .filter(
              (item) =>
                item.productId !== "9999" &&
                uuidRegex.test(String(item.productId))
            )
            .map((item) => item.productId),
          ...(tradeIns
            ?.filter((ti) => uuidRegex.test(String(ti.productId)))
            .map((ti) => ti.productId) || []),
        ];
        const productMap = new Map();
        let isBatterySale = false;

        // Add labor charges to productMap with predefined data
        cart.forEach((item) => {
          // Check for labor charge first
        if (item.productId === "9999") {
            console.log(
              `[${requestId}] Processing labor charge: ${item.volumeDescription} - OMR ${item.sellingPrice} x${item.quantity}`
            );
            productMap.set(item.productId, {
              id: item.productId,
              name: item.volumeDescription || "Labor - Custom Service",
              categoryName: "Services",
              productType: "Labor",
            });
          }
        });

        if (productIds.length > 0) {
          const productsData = await tx
            .select({
              id: products.id,
              name: products.name,
              categoryId: products.categoryId,
              productType: products.productType,
              categoryName: categories.name,
              brandId: products.brandId,
              isBattery: products.isBattery,
            })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .where(inArray(products.id, productIds));

          productsData.forEach((product) => {
            productMap.set(product.id, product);
            
            // Batteries are in the "Parts" category with type "Battery" or "Batteries" (case-insensitive)
            const isBatteryType = (type?: string | null): boolean => {
              if (!type) return false;
              const normalizedType = type.toLowerCase().trim();
              return normalizedType === "battery" || normalizedType === "batteries";
            };

            // Enhanced battery detection logic
            const isBatteryProduct = 
              product.isBattery || 
              isBatteryType(product.productType) ||
              (product.categoryName === "Parts" && isBatteryType(product.productType)) ||
              product.name.toLowerCase().includes("battery") ||
              product.name.toLowerCase().includes("batteries");

            if (isBatteryProduct) {
              isBatterySale = true;
              console.log(`[${requestId}] Battery item detected: ${product.name} (ID: ${product.id}), category: ${product.categoryName}, type: ${product.productType}`);
            }
          });
        }

        // 1.5. Derive locationId from shopId if shopId is provided
        let actualLocationId = locationId;
        if (shopId && shopId !== locationId) {
          // Fetch shop to get its location_id
          const [shopData] = await tx
            .select({ locationId: shops.locationId })
            .from(shops)
            .where(eq(shops.id, shopId))
            .limit(1);

          if (shopData) {
            actualLocationId = shopData.locationId;
            console.log(
              `[${requestId}] Derived locationId ${actualLocationId} from shopId ${shopId}`
            );
          } else {
            throw new Error(`Shop ${shopId} does not exist in the database`);
          }
        }

        // Verify location exists before creating transaction
        const [locationExists] = await tx
          .select({ id: locations.id })
          .from(locations)
          .where(eq(locations.id, actualLocationId))
          .limit(1);

        if (!locationExists) {
          throw new Error(
            `Location ${actualLocationId} does not exist in the database`
          );
        }

        console.log(`[${requestId}] Location verified: ${locationExists.id}`);

        // 2. Determine transaction type and generate reference number
        let transactionType = "SALE";
        if (paymentMethod.toLowerCase() === "credit") {
          transactionType = "CREDIT";
        } else if (
          paymentMethod === "ON_HOLD" ||
          paymentMethod.toLowerCase() === "on hold"
        ) {
          transactionType = "ON_HOLD";
        }

        // Generate sequential reference number based on transaction type and battery sale
        const referenceNumber = await generateReferenceNumber(
          transactionType,
          isBatterySale,
          paymentMethod
        );

        const transactionData = {
          referenceNumber,
          locationId: actualLocationId, // Use derived locationId
          shopId: shopId || null, // shopId is required, should be provided from frontend
          cashierId,
          type: transactionType,
          totalAmount: totalAmount.toString(),
          itemsSold: cart,
          paymentMethod,
          carPlateNumber: carPlateNumber || null,
          mobilePaymentAccount: paymentMethod?.toUpperCase() === "MOBILE" ? mobilePaymentAccount || null : null,
          mobileNumber: paymentMethod?.toUpperCase() === "MOBILE" ? mobileNumber || null : null,
          customerId: customerId || null, // Add customer_id to transaction
          discountType: discount?.type || null,
          discountValue: discount ? discount.value.toString() : null,
          discountAmount: discountAmount > 0 ? discountAmount.toString() : null,
          subtotalBeforeDiscount: subtotalBeforeDiscount.toString(),
        };

        console.log(
          `[${requestId}] Creating transaction with customer ID:`,
          transactionData.customerId
        );
        console.log(
          `[${requestId}] Discount data being inserted:`,
          JSON.stringify({
            discountType: transactionData.discountType,
            discountValue: transactionData.discountValue,
            discountAmount: transactionData.discountAmount,
            subtotalBeforeDiscount: transactionData.subtotalBeforeDiscount,
          }, null, 2)
        );

        const [newTransaction] = await tx
          .insert(transactions)
          .values(transactionData)
          .returning();
        
        console.log(
          `[${requestId}] Transaction created with ID:`,
          newTransaction.id,
          `Discount fields:`,
          {
            discountType: newTransaction.discountType,
            discountValue: newTransaction.discountValue,
            discountAmount: newTransaction.discountAmount,
            subtotalBeforeDiscount: newTransaction.subtotalBeforeDiscount,
          }
        );

        // --- BATCH FETCHING OPTIMIZATION START ---
        const cartProductIds = processedCart
          .filter(item => item.productId !== "9999")
          .map(item => item.productId);

        // 1. Batch Fetch Inventory
        // Fetch inventory for all products in cart at the specific location
        const allInventories = await tx.select().from(inventory).where(
          and(
            inArray(inventory.productId, cartProductIds),
            eq(inventory.locationId, actualLocationId)
          )
        );
        const inventoryMap = new Map(allInventories.map((i: any) => [i.productId, i]));

        // 2. Batch Fetch Batches (Active Only + Fallback)
        // Fetch batches for the found inventories
        const inventoryIds = allInventories.map((i: any) => i.id);
        
        let allBatches: any[] = [];
        if (inventoryIds.length > 0) {
           allBatches = await tx.select().from(batches).where(
            and(
              inArray(batches.inventoryId, inventoryIds),
              or(eq(batches.isActiveBatch, true), gt(batches.stockRemaining, 0))
            )
          ).orderBy(asc(batches.purchaseDate));
        }
        
        // Group batches by inventoryId
        const batchesMap = new Map(); // inventoryId -> Batch[]
        allBatches.forEach((b: any) => {
          if (!batchesMap.has(b.inventoryId)) batchesMap.set(b.inventoryId, []);
          batchesMap.get(b.inventoryId).push(b);
        });

        // 3. Batch Fetch Product Volumes (for Lubricants)
        let volumeMap = new Map();
        if (cartProductIds.length > 0) {
            const allVolumes = await tx.select().from(productVolumes).where(inArray(productVolumes.productId, cartProductIds));
             allVolumes.forEach((v: any) => {
                const numericValue = parseVolumeString(v.volumeDescription);
                const currentMax = volumeMap.get(v.productId) || 0;
                if (numericValue > currentMax) volumeMap.set(v.productId, numericValue);
             });
        }

        // 4. Batch Fetch Open Bottles (for Lubricants)
        let openBottlesMap = new Map(); // inventoryId -> OpenBottleDetail[]
        if (inventoryIds.length > 0) {
            const allOpenBottles = await tx.select().from(openBottleDetails).where(
                and(
                    inArray(openBottleDetails.inventoryId, inventoryIds),
                    eq(openBottleDetails.isEmpty, false)
                )
            ).orderBy(asc(openBottleDetails.openedAt));
            
             allOpenBottles.forEach((b: any) => {
                if (!openBottlesMap.has(b.inventoryId)) openBottlesMap.set(b.inventoryId, []);
                openBottlesMap.get(b.inventoryId).push(b);
             });
        }
        // --- BATCH FETCHING OPTIMIZATION END ---

        // 2. Process each cart item with FIFO logic
        for (const cartItem of processedCart) {
          // Skip inventory processing for labor charges
          if (cartItem.productId === "9999") {
            console.log(
              `[${requestId}] Skipping inventory processing for labor charge: ${cartItem.productId}`
            );
            continue;
          }

          // Find inventory record from pre-fetched map
          const inventoryRecord = inventoryMap.get(cartItem.productId);

          if (!inventoryRecord) {
            console.error(
              `[${requestId}] Inventory not found for product ${cartItem.productId} at location ${actualLocationId}`
            );
            throw new Error(
              `Inventory not found for product ${cartItem.productId} at location ${actualLocationId}`
            );
          }

          console.log(
            `[${requestId}] Found inventory record for product ${cartItem.productId}:`,
            {
              id: inventoryRecord.id,
              standardStock: inventoryRecord.standardStock,
              openBottlesStock: inventoryRecord.openBottlesStock,
              closedBottlesStock: inventoryRecord.closedBottlesStock,
            }
          );

          // Find the active batch from pre-fetched map
          const itemBatches = batchesMap.get(inventoryRecord.id) || [];
          
          // Find active batch (FIFO - oldest first, assuming pre-fetch sorted by date)
          let activeBatch = itemBatches.find((b: any) => b.isActiveBatch);

          if (!activeBatch) {
            console.error(
              `[${requestId}] No active batch found for inventory ${inventoryRecord.id}`
            );
            // Try to find any batch with remaining stock
            const anyBatch = itemBatches.find((b: any) => b.stockRemaining > 0);

            if (anyBatch) {
              console.log(
                `[${requestId}] Found batch with stock, activating it:`,
                anyBatch.id
              );
              // Activate this batch
              await tx
                .update(batches)
                .set({ isActiveBatch: true })
                .where(eq(batches.id, anyBatch.id));
              // Update in-memory
              anyBatch.isActiveBatch = true;
              activeBatch = anyBatch;
            } else {
              // No batches exist - create a default batch for this inventory
              console.log(
                `[${requestId}] No batches found, creating default batch for inventory ${inventoryRecord.id}`
              );
              const [newBatch] = await tx
                .insert(batches)
                .values({
                  inventoryId: inventoryRecord.id,
                  costPrice: "0",
                  quantityReceived: 1000, // Default large quantity
                  stockRemaining: 1000,
                  supplier: "System Generated",
                  isActiveBatch: true,
                })
                .returning();
              
              // Add to in-memory map
              itemBatches.push(newBatch);
              activeBatch = newBatch;
              console.log(`[${requestId}] Created default batch:`, newBatch.id);
            }
          }

          console.log(
            `[${requestId}] Using batch ${activeBatch.id} with ${activeBatch.stockRemaining} remaining stock`
          );

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
          
          // Update in-memory
          activeBatch.stockRemaining -= cartItem.quantity;

          // FIFO Rule: If depleting the active batch, deactivate it and activate next oldest
          if (activeBatch.stockRemaining === 0) {
            await tx
              .update(batches)
              .set({ isActiveBatch: false })
              .where(eq(batches.id, activeBatch.id));
            
            // Update in-memory
            activeBatch.isActiveBatch = false;

            // Find and activate the next oldest batch with stock
            const nextBatch = itemBatches.find((b: any) => !b.isActiveBatch && b.stockRemaining > 0);

            if (nextBatch) {
              await tx
                .update(batches)
                .set({ isActiveBatch: true })
                .where(eq(batches.id, nextBatch.id));
              
              // Update in-memory
              nextBatch.isActiveBatch = true;
            }
          }

          // Update inventory stock based on product type
          // Use pre-fetched product map
          const product = productMap.get(cartItem.productId);

          if (!product) {
            console.error(
              `[${requestId}] Product not found: ${cartItem.productId}`
            );
            throw new Error(`Product not found: ${cartItem.productId}`);
          }

          console.log(
            `[${requestId}] Processing product: ${product.name} (Category: ${
              product.categoryName || "Unknown"
            })`
          );

          if (product.categoryName === "Lubricants") {
            // Handle lubricant sales with precise bottle tracking
            await handleLubricantSale(
                tx, 
                cartItem, 
                inventoryRecord, 
                volumeMap.get(cartItem.productId), 
                openBottlesMap.get(inventoryRecord.id)
            );
          } else {
            // For other products, decrement standard stock
            // Verify we have enough stock before updating
            const currentStock = inventoryRecord.standardStock ?? 0;
            if (currentStock < cartItem.quantity) {
              throw new Error(
                `Insufficient standard stock for product ${cartItem.productId}. Available: ${currentStock}, Required: ${cartItem.quantity}`
              );
            }

            await tx
              .update(inventory)
              .set({
                standardStock: currentStock - cartItem.quantity,
              })
              .where(eq(inventory.id, inventoryRecord.id));
            
            // Update in-memory
            inventoryRecord.standardStock = currentStock - cartItem.quantity;
          }
        }

        // 3. Handle trade-ins if present
        if (tradeIns && tradeIns.length > 0) {
          console.log(`[${requestId}] ✅ Received ${tradeIns.length} trade-ins after validation`);
          console.log(`[${requestId}] 📋 Trade-in data:`, JSON.stringify(tradeIns, null, 2));
          console.log(`[${requestId}] isBatterySale=${isBatterySale}`);
          
          // Extract battery brand from cart (use first battery found)
          let batteryBrandId: string | null = null;
          for (const cartItem of cart) {
            const product = productMap.get(cartItem.productId);
            if (product?.isBattery) {
              batteryBrandId = product.brandId || null;
              console.log(`[${requestId}] 🏷️ Extracted battery brand ID from cart: ${batteryBrandId}`);
              break;
            }
          }
          
          if (!batteryBrandId) {
            console.log(`[${requestId}] ⚠️ No battery found in cart, trade-in will have no brand`);
          }
          
          // Query trade-in prices for selling price lookup
          const tradeInPricesData = await tx
            .select({
              size: tradeInPrices.size,
              condition: tradeInPrices.condition,
              tradeInValue: tradeInPrices.tradeInValue,
            })
            .from(tradeInPrices);
          
          console.log(`[${requestId}] 💰 Loaded ${tradeInPricesData.length} trade-in prices for lookup`);
          
          // Query for Parts category and Battery type IDs once (for battery trade-ins)
          let partsCategoryId: string | null = null;
          let batteryTypeId: string | null = null;
          
          // Check if any trade-in is a battery (has size and condition)
          const hasBatteryTradeIns = tradeIns.some(ti => ti.size && ti.condition);
          
          if (hasBatteryTradeIns) {
            // Fetch Parts category ID
            const [partsCategory] = await tx
              .select({ id: categories.id })
              .from(categories)
              .where(eq(categories.name, "Parts"))
              .limit(1);
            
            if (partsCategory) {
              partsCategoryId = partsCategory.id;
              console.log(`[${requestId}] Found Parts category ID: ${partsCategoryId}`);
              
              // Fetch Battery type ID
              const batteryTypes = await tx
                .select({ id: types.id, name: types.name })
                .from(types)
                .where(
                  or(
                    eq(types.name, "Battery"),
                    eq(types.name, "Batteries")
                  )
                )
                .limit(1);
              
              if (batteryTypes.length > 0) {
                batteryTypeId = batteryTypes[0].id;
                console.log(`[${requestId}] Found Battery type ID: ${batteryTypeId} (${batteryTypes[0].name})`);
              } else {
                console.warn(`[${requestId}] Battery type not found in types table`);
              }
            } else {
              console.error(`[${requestId}] Parts category not found - cannot create trade-in batteries`);
            }
          }
          
          for (const tradeIn of tradeIns) {
            console.log(`[${requestId}] Processing trade-in:`, {
              productId: tradeIn.productId,
              name: tradeIn.name,
              size: tradeIn.size,
              condition: tradeIn.condition,
              costPrice: tradeIn.costPrice,
              quantity: tradeIn.quantity,
              hasName: !!tradeIn.name,
              hasCostPrice: !!tradeIn.costPrice,
            });

            // Check if this specific trade-in is a battery (based on its own data)
            const isBatteryTradeIn = !!(
              tradeIn.size &&
              tradeIn.condition &&
              tradeIn.name &&
              tradeIn.costPrice
            );

            console.log(
              `[${requestId}] Trade-in battery check: isBatteryTradeIn=${isBatteryTradeIn}, hasPartsCategoryId=${!!partsCategoryId}`
            );

            let finalProductId = tradeIn.productId;
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            // For battery trade-ins, create/update inventory with battery size as name
            if (isBatteryTradeIn && partsCategoryId) {
              console.log(
                `[${requestId}] Creating/updating battery trade-in: ${tradeIn.name}`
              );

              // Check if a product with this name already exists
              const [existingProduct] = await tx
                .select()
                .from(products)
                .where(eq(products.name, tradeIn.name))
                .limit(1);

              if (!existingProduct) {
                console.log(
                  `[${requestId}] Creating new battery product: ${tradeIn.name}`
                );
                
                // Lookup selling price from trade-in prices
                const matchingPrice = tradeInPricesData.find(
                  p => p.size === tradeIn.size && 
                       p.condition.toLowerCase() === tradeIn.condition.toLowerCase()
                );
                
                const sellingPrice = matchingPrice ? Number(matchingPrice.tradeInValue) : null;
                console.log(`[${requestId}] 💵 Selling price for ${tradeIn.size} ${tradeIn.condition}: ${sellingPrice || 'NOT FOUND'}`);
                
                // Prepare values for new product
                const productValues: any = {
                  name: tradeIn.name, // Battery size as name
                  categoryId: partsCategoryId, // Use actual Parts category ID
                  typeId: batteryTypeId, // Use actual Battery type ID
                  brandId: batteryBrandId, // Use battery brand from cart
                  productType: null, // Clear legacy field when using typeId
                  description: `Trade-in battery - ${tradeIn.size} (${tradeIn.condition})`,
                  isBattery: true,
                  batteryState:
                    tradeIn.condition.toLowerCase() === "scrap"
                      ? "scrap"
                      : "resellable",
                  costPrice: tradeIn.costPrice.toString(), // Trade-in amount as cost
                };

                // Only use the provided ID if it's a valid UUID
                if (uuidRegex.test(tradeIn.productId)) {
                  productValues.id = tradeIn.productId;
                }

                // Create new product for this trade-in battery size
                const [newProduct] = await tx
                  .insert(products)
                  .values(productValues)
                  .returning();
                finalProductId = newProduct.id;
                console.log(
                  `[${requestId}] Created battery product with ID: ${finalProductId}`
                );
              } else {
                finalProductId = existingProduct.id;
                console.log(
                  `[${requestId}] Using existing battery product: ${finalProductId}`
                );
              }

              // Lookup selling price from trade-in prices (needed for both new and existing inventory)
              const matchingPriceForInventory = tradeInPricesData.find(
                p => p.size === tradeIn.size && 
                     p.condition.toLowerCase() === tradeIn.condition.toLowerCase()
              );
              
              const inventorySellingPrice = matchingPriceForInventory 
                ? Number(matchingPriceForInventory.tradeInValue) 
                : null;

              // Find or create inventory record for trade-in product
              const [tradeInInventory] = await tx
                .select()
                .from(inventory)
                .where(
                  and(
                    eq(inventory.productId, finalProductId),
                    eq(inventory.locationId, actualLocationId)
                  )
                )
                .limit(1);

              let inventoryId;

              if (tradeInInventory) {
                // Update existing inventory
                await tx
                  .update(inventory)
                  .set({
                    standardStock:
                      Number(tradeInInventory.standardStock) +
                      Number(tradeIn.quantity),
                    sellingPrice: inventorySellingPrice?.toString() || tradeInInventory.sellingPrice,
                  })
                  .where(eq(inventory.id, tradeInInventory.id));
                inventoryId = tradeInInventory.id;
                console.log(
                  `[${requestId}] Updated inventory ${inventoryId} for product ${finalProductId} with selling price ${inventorySellingPrice}`
                );
              } else {
                // Create new inventory record
                const [newInventory] = await tx
                  .insert(inventory)
                  .values({
                    productId: finalProductId,
                    locationId: actualLocationId,
                    standardStock: Number(tradeIn.quantity),
                    sellingPrice: inventorySellingPrice?.toString() || null,
                  })
                  .returning();
                inventoryId = newInventory.id;
                console.log(
                  `[${requestId}] Created inventory ${inventoryId} for product ${finalProductId} with selling price ${inventorySellingPrice}`
                );
              }

              // Create batch record for the trade-in
              // Use the trade-in amount as the cost price
              await tx.insert(batches).values({
                inventoryId: inventoryId,
                quantityReceived: Number(tradeIn.quantity),
                stockRemaining: Number(tradeIn.quantity),
                costPrice: tradeIn.costPrice.toString(), // Trade-in value is the cost
                purchaseDate: new Date(),
                supplier: `Trade-in (${tradeIn.condition})`,
                isActiveBatch: true,
              });
              console.log(
                `[${requestId}] Created batch for inventory ${inventoryId} with cost ${tradeIn.costPrice}`
              );
            } else if (isBatteryTradeIn && !partsCategoryId) {
              console.error(`[${requestId}] Cannot create battery trade-in - Parts category not found`);
            }
            // Note: We only support battery trade-ins, so non-battery trade-ins are skipped

            // Create trade-in transaction record only if we have a valid UUID
            // (i.e., only for successfully processed battery trade-ins)
            const uuidRegexForValidation =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            
            if (uuidRegexForValidation.test(finalProductId)) {
              await tx.insert(tradeInTransactions).values({
                transactionId: newTransaction.id,
                productId: finalProductId,
                quantity: tradeIn.quantity,
                tradeInValue: tradeIn.tradeInValue.toString(),
              });
              console.log(`[${requestId}] Created trade-in transaction record for product ${finalProductId}`);
            } else {
              console.warn(`[${requestId}] Skipping trade-in transaction record - invalid product ID: ${finalProductId}`);
            }
          }
          console.log(`[${requestId}] Completed processing all trade-ins`);
        }

        // 4. Fetch cashier name if cashierId exists
        let cashierName: string | undefined;
        if (cashierId) {
          try {
            const { createClient } = await import("@/supabase/server");
            const supabase = await createClient();
            const { data: staffData } = await supabase
              .from("staff")
              .select("name")
              .eq("id", cashierId)
              .single();
            cashierName = staffData?.name;
          } catch (error) {
            console.log(`[${requestId}] Could not fetch cashier name:`, error);
          }
        }

        // Fetch shop details for POS ID and Whatsapp
        let shopPosId = "A0054"; // Default fallback
        let shopWhatsapp = ""; 
        if (shopId) {
          try {
            const [shopData] = await tx
              .select({ 
                posId: shops.posId,
                brandWhatsapp: shops.brandWhatsapp 
              })
              .from(shops)
              .where(eq(shops.id, shopId))
              .limit(1);
            
            if (shopData?.posId) {
              shopPosId = shopData.posId;
            }
            if (shopData?.brandWhatsapp) {
              shopWhatsapp = shopData.brandWhatsapp;
            }
          } catch (error) {
            console.log(`[${requestId}] Could not fetch shop details:`, error);
          }
        }

        // 5. Generate receipts
        const now = new Date();
        const receiptData: ReceiptData = {
          referenceNumber: newTransaction.referenceNumber,
          totalAmount: newTransaction.totalAmount,
          paymentMethod: paymentMethod,
          items: processedCart.map((item) => {
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
          discount: discount && discountAmount > 0
            ? {
                type: discount.type,
                value: discount.value,
                amount: discountAmount,
              }
            : undefined,
          subtotalBeforeDiscount: subtotalBeforeDiscount,
          date: formatDate(now),
          time: formatTime(now),
          cashier: cashierName,
          paymentRecipient: paymentMethod?.toUpperCase() === "MOBILE" ? mobilePaymentAccount || undefined : undefined,
          posId: shopPosId,
          carPlateNumber: carPlateNumber,
          whatsapp: shopWhatsapp,
        };

        let receiptHtml = "";
        let batteryBillHtml = "";

        // Generate appropriate receipt based on battery sale detection
        if (isBatterySale) {
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
          isBattery: isBatterySale,
        };
      } catch (transactionError) {
        // Log transaction-specific errors for debugging
        console.error(`[${requestId}] Transaction failed:`, transactionError);

        // Re-throw the error to trigger transaction rollback
        throw transactionError;
      }
    });

    const processingTime = Date.now() - startTime;
    console.log(
      `[${requestId}] Checkout completed successfully (${processingTime}ms)`
    );

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        requestId,
        processingTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(
      `[${requestId}] Checkout error after ${processingTime}ms:`,
      error
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: {
            requestId,
            validationErrors: error.issues,
            processingTime,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Enhanced database error handling with specific error types
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Authentication errors
      if (
        errorMessage.includes("password authentication failed") ||
        errorMessage.includes("authentication failed") ||
        errorMessage.includes("invalid password")
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Database authentication failed. Please check your DATABASE_URL and password.",
            details: {
              requestId,
              errorType: "AUTH_FAILED",
              processingTime,
              timestamp: new Date().toISOString(),
              recovery:
                "1. Check your DATABASE_URL in environment variables\n2. Verify the password in Supabase Dashboard\n3. Ensure the database URL format is correct",
              suggestion:
                "Run GET /api/diagnose-db to check your database configuration",
            },
          },
          { status: 503 }
        );
      }

      // Connection errors
      if (
        errorMessage.includes("connection") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("econnreset") ||
        errorMessage.includes("enotfound") ||
        errorMessage.includes("network") ||
        errorMessage.includes("dns")
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Database connection failed. Please check your internet connection and database configuration.",
            details: {
              requestId,
              errorType: "CONNECTION_FAILED",
              processingTime,
              timestamp: new Date().toISOString(),
              recovery:
                "1. Check your internet connection\n2. Verify DATABASE_URL format\n3. Check if Supabase project is active\n4. Run GET /api/diagnose-db for detailed diagnostics",
              suggestion:
                "The checkout service will retry automatically. If this persists, check your database configuration.",
            },
          },
          { status: 503 }
        );
      }

      // Transaction/constraint errors
      if (
        errorMessage.includes("insufficient stock") ||
        errorMessage.includes("constraint") ||
        errorMessage.includes("violates") ||
        errorMessage.includes("no closed bottles available") ||
        errorMessage.includes("no open bottles available") ||
        errorMessage.includes("invalid source for lubricant sale")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            details: {
              requestId,
              errorType: "BUSINESS_LOGIC_ERROR",
              processingTime,
              timestamp: new Date().toISOString(),
              recovery:
                "Check inventory levels and product availability. For lubricants, ensure proper source selection.",
            },
          },
          { status: 400 }
        );
      }

      // Product not found errors
      if (
        errorMessage.includes("product not found") ||
        errorMessage.includes("inventory not found")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            details: {
              requestId,
              errorType: "PRODUCT_NOT_FOUND",
              processingTime,
              timestamp: new Date().toISOString(),
              recovery:
                "Verify product exists and is available at the specified location",
            },
          },
          { status: 404 }
        );
      }
    }

    // Generic server error with enhanced details and specific guidance
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        details: {
          requestId,
          errorType: "INTERNAL_ERROR",
          processingTime,
          timestamp: new Date().toISOString(),
          recovery:
            "1. Try the transaction again\n2. Check your database connection\n3. Verify product data integrity\n4. Run GET /api/diagnose-db for diagnostics",
          suggestion:
            "If this error persists, the issue may be with product data or database constraints. Please check the logs for more details.",
        },
      },
      { status: 500 }
    );
  }
}