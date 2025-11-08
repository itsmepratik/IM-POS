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
} from "@/lib/db/schema";
import { eq, asc, and, inArray, gt } from "drizzle-orm";
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
  inventoryRecord: any
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
    const bottleSize = await getHighestVolume(cartItem.productId, tx);
    const initialVolume = bottleSize;
    const currentVolume = initialVolume - requestedVolume;
    const isEmpty = currentVolume <= 0;

    // Decrement closed bottles stock
    await tx
      .update(inventory)
      .set({
        closedBottlesStock: inventoryRecord.closedBottlesStock - 1,
      })
      .where(eq(inventory.id, inventoryRecord.id));

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
    }
  } else if (source === "OPEN") {
    // Selling from existing open bottle(s)
    // Find all non-empty open bottles ordered by opened_at (FIFO)
    const openBottles = await tx
      .select()
      .from(openBottleDetails)
      .where(
        and(
          eq(openBottleDetails.inventoryId, inventoryRecord.id),
          eq(openBottleDetails.isEmpty, false)
        )
      )
      .orderBy(asc(openBottleDetails.openedAt));

    console.log(`[${cartItem.productId}] OPEN source - Found ${openBottles.length} open bottles`);
    console.log(`[${cartItem.productId}] OPEN source - Requested volume: ${requestedVolume}`);

    if (!openBottles || openBottles.length === 0) {
      throw new Error("No open bottles available for this lubricant");
    }

    // Calculate total available volume from all open bottles
    const totalAvailableVolume = openBottles.reduce((sum, bottle) => {
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
    const bottleSize = await getHighestVolume(cartItem.productId, tx);

    console.log(`[${cartItem.productId}] OPEN source - Processing bottles, remainingVolume=${remainingVolume}, bottleSize=${bottleSize}`);

    for (const bottle of openBottles) {
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
    // Test database connection before proceeding with checkout
    let db;
    try {
      db = getDatabase();

      // Perform a quick connection test to ensure we can actually connect
      const connectionTest = await testDatabaseConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.error || "Database connection failed");
      }

      console.log(
        `[${requestId}] Database connection verified (${connectionTest.latency}ms)`
      );
    } catch (error) {
      const dbHealth = getDatabaseHealth();
      console.error(`[${requestId}] Database connection failed:`, error);
      console.error(`[${requestId}] Database health:`, dbHealth);

      return NextResponse.json(
        {
          success: false,
          error:
            "Database service is currently unavailable. Please try again in a moment.",
          details: {
            requestId,
            databaseHealth: dbHealth,
            connectionError:
              error instanceof Error ? error.message : "Unknown error",
            suggestion: "Run GET /api/debug/database to diagnose the issue",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 503 }
      );
    }

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
              validationErrors: validationError.errors.map((err) => ({
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
      carPlateNumber,
      customerId,
      mobilePaymentAccount,
      mobileNumber,
    } = validatedInput;

    console.log(
      `[${requestId}] Customer ID received:`,
      customerId || "None (Anonymous)"
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
      if (item.productId === "9999" || item.productId === 9999) {
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

    // Calculate total amount
    const totalAmount = calculateFinalTotal(cart, tradeIns);

    // Database is already initialized and tested above

    // Perform all operations in a single transaction with enhanced error handling
    const result = await db.transaction(async (tx) => {
      try {
        // 1. Fetch product names and categories for receipt generation
        // Filter out labor charges (productId: "9999") from product lookups
        const productIds = [
          ...cart
            .filter(
              (item) => item.productId !== "9999" && item.productId !== 9999
            )
            .map((item) => item.productId),
          ...(tradeIns?.map((ti) => ti.productId) || []),
        ];
        const productMap = new Map();
        let isBatterySale = false;

        // Add labor charges to productMap with predefined data
        cart.forEach((item) => {
          if (item.productId === "9999" || item.productId === 9999) {
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
            })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .where(inArray(products.id, productIds));

          productsData.forEach((product) => {
            productMap.set(product.id, product);
            // Check if any cart item is a battery
            // Batteries are in the "Parts" category with type "Batteries"
            if (
              (product.categoryName === "Parts" &&
                product.productType === "Batteries") ||
              product.categoryName?.toLowerCase().includes("battery") ||
              product.productType?.toLowerCase().includes("battery")
            ) {
              isBatterySale = true;
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
          carPlateNumber: transactionType === "ON_HOLD" ? carPlateNumber : null,
          mobilePaymentAccount: paymentMethod?.toUpperCase() === "MOBILE" ? mobilePaymentAccount || null : null,
          mobileNumber: paymentMethod?.toUpperCase() === "MOBILE" ? mobileNumber || null : null,
          customerId: customerId || null, // Add customer_id to transaction
        };

        console.log(
          `[${requestId}] Creating transaction with customer ID:`,
          transactionData.customerId
        );

        const [newTransaction] = await tx
          .insert(transactions)
          .values(transactionData)
          .returning();

        // 2. Process each cart item with FIFO logic
        for (const cartItem of processedCart) {
          // Skip inventory processing for labor charges
          if (cartItem.productId === "9999" || cartItem.productId === 9999) {
            console.log(
              `[${requestId}] Skipping inventory processing for labor charge: ${cartItem.productId}`
            );
            continue;
          }

          // Find inventory record using derived locationId
          const [inventoryRecord] = await tx
            .select()
            .from(inventory)
            .where(
              and(
                eq(inventory.productId, cartItem.productId),
                eq(inventory.locationId, actualLocationId)
              )
            )
            .limit(1);

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
            console.error(
              `[${requestId}] No active batch found for inventory ${inventoryRecord.id}`
            );
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
              console.log(
                `[${requestId}] Found batch with stock, activating it:`,
                anyBatch.id
              );
              // Activate this batch
              await tx
                .update(batches)
                .set({ isActiveBatch: true })
                .where(eq(batches.id, anyBatch.id));
              // Use this batch as the active batch
              activeBatch = { ...anyBatch, isActiveBatch: true };
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

          if (!product[0]) {
            console.error(
              `[${requestId}] Product not found: ${cartItem.productId}`
            );
            throw new Error(`Product not found: ${cartItem.productId}`);
          }

          console.log(
            `[${requestId}] Processing product: ${product[0].name} (Category: ${
              productMap.get(cartItem.productId)?.categoryName || "Unknown"
            })`
          );

          if (
            productMap.get(cartItem.productId)?.categoryName === "Lubricants"
          ) {
            // Handle lubricant sales with precise bottle tracking
            await handleLubricantSale(tx, cartItem, inventoryRecord);
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

            // For battery trade-ins, create/update inventory with battery size as name
            if (isBatterySale && tradeIn.name && tradeIn.costPrice) {
              // Check if a product with this name already exists
              const [existingProduct] = await tx
                .select()
                .from(products)
                .where(eq(products.name, tradeIn.name))
                .limit(1);

              let productId = tradeIn.productId;

              if (!existingProduct) {
                // Create new product for this trade-in battery size
                const [newProduct] = await tx
                  .insert(products)
                  .values({
                    id: tradeIn.productId,
                    name: tradeIn.name, // Battery size as name
                    categoryId: "parts-category-id", // Default to parts category
                    productType: "Trade-in Battery",
                    description: `Trade-in battery - ${tradeIn.size} (${tradeIn.condition})`,
                  })
                  .returning();
                productId = newProduct.id;
              }

              // Find or create inventory record for trade-in product
              const [tradeInInventory] = await tx
                .select()
                .from(inventory)
                .where(
                  and(
                    eq(inventory.productId, productId),
                    eq(inventory.locationId, locationId)
                  )
                )
                .limit(1);

              if (tradeInInventory) {
                // Increment standard stock for trade-in product
                const currentTradeInStock = tradeInInventory.standardStock ?? 0;
                await tx
                  .update(inventory)
                  .set({
                    standardStock: currentTradeInStock + tradeIn.quantity,
                  })
                  .where(eq(inventory.id, tradeInInventory.id));
              } else {
                // Create new inventory record with cost price
                await tx.insert(inventory).values({
                  productId: productId,
                  locationId: locationId,
                  standardStock: tradeIn.quantity,
                });
              }

              // Create a batch record with the trade-in amount as cost price
              await tx.insert(batches).values({
                inventoryId: tradeInInventory?.id || productId, // Use inventory ID if available
                costPrice: tradeIn.costPrice.toString(),
                quantityReceived: tradeIn.quantity,
                stockRemaining: tradeIn.quantity,
                supplier: `Trade-in (${tradeIn.condition})`,
                isActiveBatch: true,
              });
            } else {
              // Handle regular trade-ins (non-battery)
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
                const currentTradeInStock = tradeInInventory.standardStock ?? 0;
                await tx
                  .update(inventory)
                  .set({
                    standardStock: currentTradeInStock + tradeIn.quantity,
                  })
                  .where(eq(inventory.id, tradeInInventory.id));
              } else {
                // If no inventory record exists, create one
                await tx.insert(inventory).values({
                  productId: tradeIn.productId,
                  locationId: locationId,
                  standardStock: tradeIn.quantity,
                });
              }
            }
          }
        }

        // 4. Generate receipts
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
          date: formatDate(now),
          time: formatTime(now),
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
            validationErrors: error.errors,
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
