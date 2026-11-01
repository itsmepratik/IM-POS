import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import {
  getDatabase,
  isDatabaseAvailable,
  getDatabaseHealth,
  testDatabaseConnection,
} from "@/lib/db/client";
import { shops, inventory, cashShifts } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { CheckoutInputSchema, calculateFinalTotal } from "@/lib/types/checkout";
import type { CheckoutInput } from "@/lib/types/checkout";
import { CACHE_TAGS } from "@/lib/db/cache-tags";
import {
  encodeSplitPaymentMethod,
  isSplitPaymentMethod,
  roundOMR,
  validateSplitPayment,
} from "@/lib/payments/split-payments";

// Helper functions removed - logic moved to database stored procedure

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper for delay
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface PgErrorInfo {
  message: string;
  code?: string;
  constraint?: string;
}

/**
 * Drizzle >=0.44 wraps driver errors in DrizzleQueryError ("Failed query:
 * <sql>") with the postgres-js error on `.cause`. Extract the real Postgres
 * message/code/constraint so callers can classify and display it.
 */
function unwrapPgError(error: unknown): PgErrorInfo {
  const read = (value: unknown): PgErrorInfo | null => {
    if (typeof value !== "object" || value === null) return null;
    const v = value as { message?: unknown; code?: unknown; constraint_name?: unknown };
    if (typeof v.code !== "string") return null;
    return {
      message: typeof v.message === "string" ? v.message : "Database error",
      code: v.code,
      constraint: typeof v.constraint_name === "string" ? v.constraint_name : undefined,
    };
  };
  const direct = read(error);
  if (direct) return direct;
  if (error instanceof Error) {
    return read(error.cause) ?? { message: error.message };
  }
  return { message: String(error) };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    if (!req.body) {
      return NextResponse.json(
        { success: false, error: "Request body is required" },
        { status: 400 },
      );
    }

    // Check database availability - CRITICAL FIX: await the test
    if (!isDatabaseAvailable()) {
      await testDatabaseConnection(); // Wait for it!
      if (!isDatabaseAvailable()) {
        // Double check
        console.error(`[${requestId}] Database still unavailable after test.`);
        return NextResponse.json(
          { success: false, error: "Database unavailable" },
          { status: 503 },
        );
      }
    }

    const db = getDatabase();
    const body = await req.json();

    // Validate Input
    const parsedInput = CheckoutInputSchema.safeParse(body);
    if (!parsedInput.success) {
      const firstIssue = parsedInput.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: `Invalid input: ${firstIssue ? `${firstIssue.path.join(".") || "body"} — ${firstIssue.message}` : "unknown"}`,
          details: parsedInput.error.issues,
        },
        { status: 400 },
      );
    }
    const validatedInput = parsedInput.data;

    const {
      shopId,
      paymentMethod: rawPaymentMethod,
      cashierId: cashierIdInput,
      cart,
      tradeIns,
      discount,
      carPlateNumber,
      customerId,
      mobilePaymentAccount,
      mobileNumber,
      referenceNumber: clientReferenceNumber,
      services,
      splitPayments,
    } = validatedInput;

    // The shop is the single source of truth: its location is the inventory
    // the sale deducts from. No placeholder / fuzzy / "first shop" fallbacks —
    // those silently recorded sales against the wrong register.
    const [shopRow] = await db
      .select({ id: shops.id, locationId: shops.locationId, shopCode: shops.shopCode })
      .from(shops)
      .where(eq(shops.id, shopId))
      .limit(1);
    if (!shopRow) {
      return NextResponse.json(
        { success: false, error: "Selected shop no longer exists. Refresh the POS and select a location." },
        { status: 400 },
      );
    }
    const resolvedShopId: string = shopRow.id;
    const actualLocationId: string = shopRow.locationId;

    // Validate Cashier
    // Placeholder ids ("default-cashier", "on-hold-system") mean "no cashier"
    // — they must never reach the ::uuid cast in the stored procedure.
    let cashierId: string | undefined =
      cashierIdInput === "default-cashier" || cashierIdInput === "on-hold-system"
        ? undefined
        : cashierIdInput;
    if (cashierId) {
      const { getStaffUuidById } = await import("@/lib/utils/staff-validation");
      const staffUuid = await getStaffUuidById(cashierId);
      if (!staffUuid) {
        return NextResponse.json(
          { success: false, error: "Invalid cashier ID" },
          { status: 400 },
        );
      }
      cashierId = staffUuid;
    }

    // STRICT CASH SHIFT VALIDATION (fast-fail with a clear message).
    // The stored procedure re-checks and locks the shift atomically, so this
    // pre-check is UX only — it cannot be raced into an unlinked sale.
    const [activeShift] = await db
      .select({ id: cashShifts.id })
      .from(cashShifts)
      .where(and(eq(cashShifts.shopId, resolvedShopId), eq(cashShifts.status, "open")))
      .limit(1);

    if (!activeShift) {
      return NextResponse.json(
        {
          success: false,
          error: "No active cash shift for this shop. Open a cash shift for this location first.",
        },
        { status: 409 },
      );
    }

    // Process Cart — allow empty cart when services (labor) are present
    const hasServices = services && services.length > 0;
    if ((!cart || cart.length === 0) && !hasServices) {
      return NextResponse.json(
        { success: false, error: "Cart cannot be empty" },
        { status: 400 },
      );
    }

    // Pre-process Cart (ensure sources)
    const processedCart = cart.map((item) => ({
      ...item,
      source: item.source || "CLOSED",
    }));

    // Calculate Totals — include services (labor) in subtotal
    const { subtotalBeforeDiscount: cartSubtotal, discountAmount, finalTotal: cartFinalTotal } =
      calculateFinalTotal(cart, tradeIns, discount);
    const servicesTotal = services
      ? services.reduce((sum, s) => sum + s.amount * (s.quantity || 1), 0)
      : 0;
    const subtotalBeforeDiscount = cartSubtotal + servicesTotal;
    const finalTotal = cartFinalTotal + servicesTotal;

    // Split tender: cash + card must exactly cover the final total.
    // The encoded method (SPLIT_CASH_x_CARD_y) is stored in payment_method.
    let paymentMethod: string = rawPaymentMethod;
    if (isSplitPaymentMethod(rawPaymentMethod)) {
      if (!splitPayments || splitPayments.length !== 2) {
        return NextResponse.json(
          {
            success: false,
            error:
              "splitPayments with one CASH and one CARD leg is required for SPLIT payments",
          },
          { status: 400 },
        );
      }
      const cashLeg = splitPayments.find((leg) => leg.method === "CASH");
      const cardLeg = splitPayments.find((leg) => leg.method === "CARD");
      if (!cashLeg || !cardLeg) {
        return NextResponse.json(
          {
            success: false,
            error: "SPLIT payments require exactly one CASH and one CARD leg",
          },
          { status: 400 },
        );
      }
      const splitCheck = validateSplitPayment({
        cashAmount: cashLeg.amount,
        cardAmount: cardLeg.amount,
        total: roundOMR(finalTotal),
      });
      if (!splitCheck.valid) {
        return NextResponse.json(
          {
            success: false,
            error: "Split amounts must equal the total amount",
            details: splitCheck.errors,
          },
          { status: 400 },
        );
      }
      paymentMethod = encodeSplitPaymentMethod(
        splitCheck.cashAmount,
        splitCheck.cardAmount,
      );
    }

    // Determine Transaction Type
    let transactionType = "SALE";
    if (paymentMethod.toLowerCase() === "credit") transactionType = "CREDIT";
    else if (
      paymentMethod.toUpperCase() === "ON_HOLD" ||
      paymentMethod.toLowerCase() === "on hold"
    )
      transactionType = "ON_HOLD";

    let referenceNumber = clientReferenceNumber;

    if (referenceNumber) {
      // Sync reference counter to DB
      try {
        // Format of clientReferenceNumber is: [PREFIX][SHOP_CODE][3-DIGIT-COUNTER][MMYY]
        const shopCode = shopRow.shopCode || "01";

        // The prefix in clientReferenceNumber is at the start (1 or 2 letters: e.g. WB, R, OH, ST, B, A)
        let prefix = "A";
        if (referenceNumber.startsWith("WB")) prefix = "WB";
        else if (referenceNumber.startsWith("R")) prefix = "R";
        else if (referenceNumber.startsWith("OH")) prefix = "OH";
        else if (referenceNumber.startsWith("ST")) prefix = "ST";
        else if (referenceNumber.startsWith("B")) prefix = "B";

        // Extract counter and MMYY based on prefix and shopCode lengths
        const counterStartIdx = prefix.length + shopCode.length;
        const counterStr = referenceNumber.substring(counterStartIdx, counterStartIdx + 3);
        const mmyy = referenceNumber.substring(counterStartIdx + 3);

        const counterVal = parseInt(counterStr, 10);

        if (!isNaN(counterVal)) {
          const counterKey = `${prefix}_${shopCode}_${mmyy}`;
          // Atomically update DB counter to be at least counterVal
          await db.execute(sql`
            INSERT INTO reference_number_counters (prefix, counter, updated_at)
            VALUES (${counterKey}, ${counterVal}, now())
            ON CONFLICT (prefix) DO UPDATE
            SET counter = GREATEST(reference_number_counters.counter, EXCLUDED.counter),
                updated_at = now()
          `);
        }
      } catch (err) {
        console.error("Failed to sync client reference number counter:", err);
      }
    } else {
      // Generate Reference Number
      const { generateReferenceNumber } =
        await import("@/lib/utils/reference-numbers");

      // Determine if battery transaction by querying DB safely
      const productIds = cart.map((i) => i.productId);
      const validProductIds = productIds.filter((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        ),
      );

      let isBatteryTransaction = false;
      if (validProductIds.length > 0) {
        const { products } = await import("@/lib/db/schema");
        const { eq, inArray, and } = await import("drizzle-orm");
        const batteryProducts = await db
          .select({ id: products.id })
          .from(products)
          .where(
            and(
              inArray(products.id, validProductIds),
              eq(products.isBattery, true),
            ),
          )
          .limit(1);

        if (batteryProducts.length > 0) {
          isBatteryTransaction = true;
        }
      }
      referenceNumber = await generateReferenceNumber(
        transactionType,
        isBatteryTransaction,
        paymentMethod,
        resolvedShopId,
      );
    }

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
        const productIds = processedCart.map((i) => i.productId);
        // Filter for valid UUIDs only to prevent DB errors with "9999" (Labor Charge)
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validProductIds = productIds.filter((id) => uuidRegex.test(id));

        // Fetch critical data for cost calculation:
        // 1. Products (for base Cost Price and Category)
        // 2. Active Batches (for FIFO/Active Batch Cost Price)
        // 3. Product Volumes (for Lubricant Max Volume inference)

        // 1. Fetch Products
        // Only query if we have valid UUIDs
        const productsData =
          validProductIds.length > 0
            ? await db.query.products.findMany({
                where: (products, { inArray }) =>
                  inArray(products.id, validProductIds),
                with: {
                  category: true, // to check if fluid
                },
              })
            : [];

        // 2. Fetch Inventory for these products AT THIS SHOP'S LOCATION only —
        // otherwise cost snapshots could come from another location's batches.
        const inventoryData =
          validProductIds.length > 0
            ? await db
                .select()
                .from(inventory)
                .where(
                  and(
                    eq(inventory.locationId, actualLocationId),
                    inArray(inventory.productId, validProductIds),
                  ),
                )
            : [];

        const inventoryMap = new Map<string, string>(); // inventoryId -> productId
        const inventoryIds = inventoryData.map((inv) => {
          inventoryMap.set(inv.id, inv.productId);
          return inv.id;
        });

        // 3. Fetch Batches for those inventory records (EXPLICIT - not subquery)
        let activeBatchesData: any[] = [];
        if (inventoryIds.length > 0) {
          const allBatches = await db.execute(sql`
                SELECT * FROM batches 
                WHERE inventory_id IN (${sql.join(
                  inventoryIds.map((id) => sql`${id}::uuid`),
                  sql`, `,
                )})
                ORDER BY is_active_batch DESC, purchase_date DESC
            `);
          activeBatchesData = (allBatches as any[]).map((b) => ({
            ...b,
            inventoryProductId: inventoryMap.get(b.inventory_id), // Attach productId for easy lookup
          }));
        }

        // 4. Fetch Product Volumes (only for fluids needed really, but easier to fetch all matching products)
        // Use validProductIds
        const productVolumesData =
          validProductIds.length > 0
            ? await db.query.productVolumes.findMany({
                where: (volumes, { inArray }) =>
                  inArray(volumes.productId, validProductIds),
              })
            : [];

        const { calculateItemCost, resolveCostPrice } =
          await import("@/lib/utils/cost-calc");

        // Enhance Cart with Cost Price
        const cartWithCost = processedCart.map((item) => {
          const product = productsData.find((p) => p.id === item.productId);
          if (!product) return item; // Should be caught by validation really

          // Find best batch for this product (active > latest)
          const batchForProduct = activeBatchesData.find(
            (b) => b.inventoryProductId === item.productId,
          );

          // Use centralized cost resolution with batch-first priority
          const { cost: baseCost, source: costSource } = resolveCostPrice({
            activeBatchCost: batchForProduct?.cost_price,
            productCost: product.costPrice,
            productName: product.name,
          });

          // Robust isFluid check using includes()
          const catName = product.category?.name?.toLowerCase() || "";
          const isFluid =
            catName.includes("fluid") ||
            catName.includes("oil") ||
            catName.includes("lubricant");

          const allVolumeDescriptions = productVolumesData
            .filter((v) => v.productId === item.productId)
            .map((v) => v.volumeDescription);

          const costPrice = calculateItemCost({
            baseCost,
            isFluid,
            itemVolume: item.volumeDescription,
            allVolumeDescriptions,
          });

          return {
            ...item,
            costPrice,
            // Persist strict snapshot data
            batchId: batchForProduct?.id,
            originalBaseCost: baseCost,
            costSource, // Track where cost came from for debugging
          };
        });

        // Convert enhanced cart to strictly serializable object
        const cartJson = JSON.stringify(cartWithCost);

        const result = await db.execute(sql`
          SELECT create_checkout_transaction(
            ${actualLocationId}::uuid,
            ${resolvedShopId || null}::uuid,
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
            ${paymentMethod?.toUpperCase() === "MOBILE" && mobilePaymentAccount ? mobilePaymentAccount : null}::text,
            ${paymentMethod?.toUpperCase() === "MOBILE" && mobileNumber ? mobileNumber : null}::text,
            ${null}::text,
            ${JSON.stringify(tradeIns || [])}::jsonb,
            ${referenceNumber}::text,
            ${services ? JSON.stringify(services) : null}::jsonb
          ) as data
        `);

        // The result comes back as [{ data: { transaction_id: ..., reference_number: ... } }]
        // Drizzle/Postgres returns array of rows.
        if (!result || result.length === 0 || !result[0].data) {
          throw new Error("Database transaction returned no result");
        }

        // cash_shift_id is written by the procedure in the same transaction.
        const transactionData = result[0].data as {
          transaction_id: string;
          reference_number: string;
        };

        const processingTime = Date.now() - startTime;

        // Revalidate cache
        revalidateTag(CACHE_TAGS.inventory(actualLocationId));
        revalidateTag(CACHE_TAGS.products(actualLocationId));
        revalidateTag(CACHE_TAGS.ALL_PRODUCTS);
        revalidateTag(CACHE_TAGS.DASHBOARD);
        revalidateTag(CACHE_TAGS.CASH_SHIFTS);
        if (resolvedShopId) {
          revalidateTag(CACHE_TAGS.cashShift(resolvedShopId));
        }
        revalidateTag("brands"); // Just in case, though brands strictly shouldn't change in checkout

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
      } catch (e: unknown) {
        const pg = unwrapPgError(e);
        console.error(`[${requestId}] Error attempt ${attempt}:`, pg.code, pg.message);
        lastError = e;

        // Two terminals generated the same client receipt number: issue a
        // server-side number and retry instead of losing the sale. The new
        // number is returned to the client, which updates the receipt.
        if (
          pg.code === "23505" &&
          pg.constraint === "transactions_reference_number_unique" &&
          attempt < MAX_RETRIES
        ) {
          const { generateReferenceNumber } = await import("@/lib/utils/reference-numbers");
          referenceNumber = await generateReferenceNumber(
            transactionType,
            (referenceNumber ?? "").startsWith("B"),
            paymentMethod,
            resolvedShopId,
          );
          continue;
        }

        const isConnectionError =
          pg.message.includes("connection") ||
          pg.message.includes("timeout") ||
          pg.message.includes("ETIMEDOUT") ||
          pg.message.includes("ECONNRESET") ||
          pg.code === "57P01" || // admin_shutdown
          pg.code === "57P03"; // cannot_connect_now

        if (!isConnectionError) {
          break; // Logical error, don't retry
        }

        // Connection error: explicitly try to fix connection before next retry
        try {
          await testDatabaseConnection();
        } catch (connErr) {
          console.error(
            `[${requestId}] Failed to reconnect during retry:`,
            connErr,
          );
        }
      }
    }

    // If we're here, all retries failed
    throw lastError;
  } catch (error: unknown) {
    const pg = unwrapPgError(error);
    console.error(`[${requestId}] Checkout Error (Final):`, pg.code, pg.message);
    // P0001 = RAISE EXCEPTION in the procedure (business rule: no shift,
    // insufficient stock, shop/location mismatch). Return the human message
    // verbatim with 409 so the client shows it and does not retry.
    // Never echo raw driver errors (they contain SQL and parameters).
    const isBusinessRule = pg.code === "P0001";
    return NextResponse.json(
      {
        success: false,
        error: isBusinessRule ? pg.message : `Checkout failed (${pg.code ?? "unknown"}). Reference: ${requestId}`,
        details: { requestId },
      },
      { status: isBusinessRule ? 409 : 500 },
    );
  }
}
