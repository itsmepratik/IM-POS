import { NextRequest, NextResponse } from "next/server";
import { getDatabase, isDatabaseAvailable } from "@/lib/db/client";
import {
  transactions,
  inventory,
  batches,
  products,
  locations,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Checkout Flow Test Endpoint
 *
 * This endpoint tests the complete checkout flow including:
 * - Stock validation
 * - Transaction recording
 * - Stock deduction
 * - FIFO batch management
 */

export async function GET(req: NextRequest) {
  try {
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 503 }
      );
    }

    const db = getDatabase();

    // Test data for checkout simulation
    const testCheckoutData = {
      locationId: "test-location-001",
      shopId: "test-shop-001",
      paymentMethod: "CASH",
      cashierId: "test-cashier-001",
      cart: [
        {
          productId: "1", // This should be an existing product
          quantity: 1,
          sellingPrice: 25.0,
          volumeDescription: "Test Product 1L",
          source: "CLOSED",
        },
      ],
    };

    const testResults: any = {
      preCheckout: {},
      checkout: {},
      postCheckout: {},
      summary: {
        stockDeducted: false,
        transactionRecorded: false,
        batchUpdated: false,
        errors: [],
      },
    };

    // Step 1: Pre-checkout validation - Check available products and stock
    try {
      const availableProducts = await db
        .select({
          id: products.id,
          name: products.name,
          type: products.productType,
        })
        .from(products)
        .limit(5);

      testResults.preCheckout.productsAvailable = availableProducts.length;
      testResults.preCheckout.sampleProducts = availableProducts;

      if (availableProducts.length === 0) {
        testResults.summary.errors.push(
          "No products available in database for testing"
        );
      }

      // Check inventory for first product
      if (availableProducts.length > 0) {
        const firstProduct = availableProducts[0];
        const inventoryRecord = await db
          .select()
          .from(inventory)
          .where(eq(inventory.productId, firstProduct.id))
          .limit(1);

        testResults.preCheckout.inventoryCheck = {
          productId: firstProduct.id,
          inventoryExists: inventoryRecord.length > 0,
          stock: inventoryRecord[0]?.totalStock || 0,
        };

        if (inventoryRecord.length > 0) {
          // Update test data with actual product
          testCheckoutData.cart[0].productId = firstProduct.id;

          // Check batches for this inventory
          const availableBatches = await db
            .select()
            .from(batches)
            .where(eq(batches.inventoryId, inventoryRecord[0].id));

          testResults.preCheckout.batchesAvailable = availableBatches.length;
          testResults.preCheckout.activeBatches = availableBatches.filter(
            (b) => b.isActiveBatch
          );
        }
      }

      // Check if we have a location
      const locationExists = await db
        .select()
        .from(locations)
        .where(eq(locations.id, testCheckoutData.locationId))
        .limit(1);

      testResults.preCheckout.locationExists = locationExists.length > 0;

      if (locationExists.length === 0) {
        testResults.summary.errors.push(
          "Test location does not exist in database"
        );
      }
    } catch (error) {
      testResults.preCheckout.error =
        error instanceof Error ? error.message : "Unknown error";
      testResults.summary.errors.push(
        `Pre-checkout validation failed: ${testResults.preCheckout.error}`
      );
    }

    // Step 2: Simulate checkout if prerequisites are met
    if (testResults.summary.errors.length === 0) {
      try {
        const checkoutResponse = await fetch(
          `${req.nextUrl.origin}/api/checkout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(testCheckoutData),
          }
        );

        const checkoutResult = await checkoutResponse.json();

        testResults.checkout = {
          status: checkoutResponse.status,
          success: checkoutResult.success,
          data: checkoutResult.data,
          error: checkoutResult.error,
        };

        if (checkoutResult.success) {
          testResults.summary.transactionRecorded = true;

          // Step 3: Post-checkout verification
          const transactionId = checkoutResult.data?.transaction?.id;

          if (transactionId) {
            // Verify transaction was recorded
            const recordedTransaction = await db
              .select()
              .from(transactions)
              .where(eq(transactions.id, transactionId))
              .limit(1);

            testResults.postCheckout.transactionVerified =
              recordedTransaction.length > 0;

            if (recordedTransaction.length > 0) {
              testResults.postCheckout.transactionDetails = {
                id: recordedTransaction[0].id,
                referenceNumber: recordedTransaction[0].referenceNumber,
                totalAmount: recordedTransaction[0].totalAmount,
                createdAt: recordedTransaction[0].createdAt,
              };
            }

            // Verify stock was deducted (compare with pre-checkout values)
            const productId = testCheckoutData.cart[0].productId;
            const postInventory = await db
              .select()
              .from(inventory)
              .where(eq(inventory.productId, productId))
              .limit(1);

            if (postInventory.length > 0) {
              const originalStock =
                testResults.preCheckout.inventoryCheck?.stock || 0;
              const currentStock = postInventory[0].totalStock;
              const expectedReduction = testCheckoutData.cart[0].quantity;

              testResults.postCheckout.stockVerification = {
                originalStock,
                currentStock,
                expectedReduction,
                actualReduction: originalStock - (currentStock ?? 0),
                stockDeductedCorrectly:
                  originalStock - (currentStock ?? 0) === expectedReduction,
              };

              testResults.summary.stockDeducted =
                testResults.postCheckout.stockVerification.stockDeductedCorrectly;
            }

            // Verify batch was updated
            if (testResults.preCheckout.inventoryCheck) {
              const updatedBatches = await db
                .select()
                .from(batches)
                .where(eq(batches.inventoryId, postInventory[0].id));

              testResults.postCheckout.batchVerification = {
                batchesCount: updatedBatches.length,
                activeBatches: updatedBatches.filter((b) => b.isActiveBatch)
                  .length,
              };

              testResults.summary.batchUpdated = updatedBatches.some(
                (batch) => batch.stockRemaining < batch.quantityReceived
              );
            }
          }
        } else {
          testResults.summary.errors.push(
            `Checkout failed: ${checkoutResult.error}`
          );
        }
      } catch (error) {
        testResults.checkout.error =
          error instanceof Error ? error.message : "Unknown checkout error";
        testResults.summary.errors.push(
          `Checkout API call failed: ${testResults.checkout.error}`
        );
      }
    }

    // Overall assessment
    const allTestsPassed =
      testResults.summary.transactionRecorded &&
      testResults.summary.stockDeducted &&
      testResults.summary.errors.length === 0;

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed
        ? "✅ Checkout flow is working correctly! Stock deduction and transaction recording are functional."
        : "❌ Checkout flow has issues. Check the details below.",
      testResults,
      recommendations: generateRecommendations(testResults),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Checkout test error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Checkout flow test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(testResults: any): string[] {
  const recommendations: string[] = [];

  if (testResults.preCheckout?.productsAvailable === 0) {
    recommendations.push(
      "Add some products to your database using migrations or seed data"
    );
  }

  if (!testResults.preCheckout?.locationExists) {
    recommendations.push("Create a test location in your database");
  }

  if (
    testResults.preCheckout?.inventoryCheck &&
    !testResults.preCheckout.inventoryCheck.inventoryExists
  ) {
    recommendations.push("Set up inventory records for your products");
  }

  if (!testResults.summary.transactionRecorded) {
    recommendations.push(
      "Check your checkout API implementation and database schema"
    );
  }

  if (!testResults.summary.stockDeducted) {
    recommendations.push(
      "Verify that stock deduction logic is working in your checkout process"
    );
  }

  if (testResults.summary.errors.length > 0) {
    recommendations.push("Resolve the errors listed in the test results");
    recommendations.push(
      "Check your database connection and ensure all required tables exist"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Your checkout system appears to be working correctly!"
    );
    recommendations.push(
      "Consider setting up automated tests for ongoing validation"
    );
  }

  return recommendations;
}

/**
 * Create test data for checkout testing
 * POST /api/checkout/test
 */
export async function POST(req: NextRequest) {
  try {
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { action = "create-test-data" } = body;

    if (action === "create-test-data") {
      return await createTestData(req);
    }

    return NextResponse.json(
      { success: false, error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function createTestData(req: NextRequest) {
  // This would create minimal test data needed for checkout testing
  // Implementation would depend on your specific schema and requirements

  return NextResponse.json({
    success: true,
    message:
      "Test data creation endpoint - implement based on your schema requirements",
    note: "This endpoint can be used to set up minimal test data for checkout flow validation",
  });
}
