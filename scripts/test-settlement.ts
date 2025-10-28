/**
 * Settlement Functionality Test Script
 *
 * This script tests the complete settlement workflow:
 * 1. Creates test ON_HOLD and CREDIT transactions
 * 2. Tests settlement of these transactions
 * 3. Validates the settlement records
 * 4. Tests edge cases (duplicate settlements, invalid references, etc.)
 */

import { createClient } from "@supabase/supabase-js";

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test data
const TEST_LOCATION_ID = "test-location-id"; // Will be fetched from DB
const TEST_CASHIER_ID = "0001"; // Will be verified from DB

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function log(message: string, data?: any) {
  console.log(`[TEST] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function getTestLocation() {
  const { data, error } = await supabase
    .from("locations")
    .select("id, name")
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("No locations found in database");
  }

  return data;
}

async function getTestCashier() {
  const { data, error } = await supabase
    .from("staff")
    .select("staff_id, name")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("No active staff members found in database");
  }

  return data;
}

async function createTestTransaction(
  type: "ON_HOLD" | "CREDIT",
  locationId: string
) {
  const referenceNumber = `TEST-${type}-${Date.now()}`;

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      reference_number: referenceNumber,
      location_id: locationId,
      shop_id: locationId,
      cashier_id: TEST_CASHIER_ID,
      type: type,
      total_amount: "25.500",
      payment_method: type === "ON_HOLD" ? "ON_HOLD" : "CREDIT",
      items_sold: [
        {
          productId: "test-product-1",
          name: "Test Product",
          quantity: 2,
          sellingPrice: 12.75,
        },
      ],
      car_plate_number: type === "ON_HOLD" ? "TEST-1234" : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test transaction: ${error.message}`);
  }

  return data;
}

async function testSettleTransaction(
  referenceNumber: string,
  cashierId: string
) {
  const response = await fetch(`${API_BASE_URL}/api/settle-transaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      referenceNumber,
      cashierId,
      paymentMethod: "CASH",
    }),
  });

  const result = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    data: result,
  };
}

async function testCheckSettlementEligibility(referenceNumber: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/settle-transaction?reference=${referenceNumber}`
  );

  const result = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    data: result,
  };
}

async function verifySettlementInDatabase(originalReference: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("original_reference_number", originalReference)
    .in("type", ["ON_HOLD_PAID", "CREDIT_PAID"])
    .single();

  if (error) {
    return { found: false, error: error.message };
  }

  return { found: true, data };
}

async function cleanupTestTransactions() {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .like("reference_number", "TEST-%");

  if (error) {
    log("Warning: Could not cleanup test transactions", error.message);
  } else {
    log("✓ Cleanup completed");
  }
}

// Test Suite
async function runTests() {
  log("=".repeat(60));
  log("SETTLEMENT FUNCTIONALITY TEST SUITE");
  log("=".repeat(60));

  try {
    // Setup
    log("\n📋 Setup: Fetching test data...");
    const location = await getTestLocation();
    const cashier = await getTestCashier();
    log(`✓ Location: ${location.name} (${location.id})`);
    log(`✓ Cashier: ${cashier.name} (${cashier.staff_id})`);

    // Test 1: Create ON_HOLD transaction
    log("\n🧪 Test 1: Create ON_HOLD transaction");
    let onHoldTransaction;
    try {
      onHoldTransaction = await createTestTransaction("ON_HOLD", location.id);
      log(
        `✓ Created ON_HOLD transaction: ${onHoldTransaction.reference_number}`
      );
      results.push({ name: "Create ON_HOLD transaction", passed: true });
    } catch (error) {
      log(`✗ Failed to create ON_HOLD transaction: ${error}`);
      results.push({
        name: "Create ON_HOLD transaction",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 2: Create CREDIT transaction
    log("\n🧪 Test 2: Create CREDIT transaction");
    let creditTransaction;
    try {
      creditTransaction = await createTestTransaction("CREDIT", location.id);
      log(
        `✓ Created CREDIT transaction: ${creditTransaction.reference_number}`
      );
      results.push({ name: "Create CREDIT transaction", passed: true });
    } catch (error) {
      log(`✗ Failed to create CREDIT transaction: ${error}`);
      results.push({
        name: "Create CREDIT transaction",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 3: Check settlement eligibility for ON_HOLD transaction
    if (onHoldTransaction) {
      log("\n🧪 Test 3: Check settlement eligibility (ON_HOLD)");
      try {
        const eligibility = await testCheckSettlementEligibility(
          onHoldTransaction.reference_number
        );

        if (
          eligibility.ok &&
          eligibility.data.success &&
          eligibility.data.data.isEligible &&
          !eligibility.data.data.isSettled
        ) {
          log("✓ ON_HOLD transaction is eligible for settlement");
          results.push({
            name: "Check ON_HOLD settlement eligibility",
            passed: true,
          });
        } else {
          throw new Error("Unexpected eligibility response");
        }
      } catch (error) {
        log(`✗ Settlement eligibility check failed: ${error}`);
        results.push({
          name: "Check ON_HOLD settlement eligibility",
          passed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Test 4: Settle ON_HOLD transaction
    if (onHoldTransaction) {
      log("\n🧪 Test 4: Settle ON_HOLD transaction");
      try {
        const settlement = await testSettleTransaction(
          onHoldTransaction.reference_number,
          cashier.staff_id
        );

        if (settlement.ok && settlement.data.success) {
          log("✓ ON_HOLD transaction settled successfully");
          log(
            `  Settlement reference: ${settlement.data.data.settlementTransaction.referenceNumber}`
          );
          results.push({ name: "Settle ON_HOLD transaction", passed: true });

          // Verify in database
          const verification = await verifySettlementInDatabase(
            onHoldTransaction.reference_number
          );
          if (verification.found) {
            log("✓ Settlement verified in database");
            results.push({
              name: "Verify ON_HOLD settlement in database",
              passed: true,
            });
          } else {
            throw new Error("Settlement not found in database");
          }
        } else {
          throw new Error(
            settlement.data.error || "Settlement failed without error message"
          );
        }
      } catch (error) {
        log(`✗ Failed to settle ON_HOLD transaction: ${error}`);
        results.push({
          name: "Settle ON_HOLD transaction",
          passed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Test 5: Settle CREDIT transaction
    if (creditTransaction) {
      log("\n🧪 Test 5: Settle CREDIT transaction");
      try {
        const settlement = await testSettleTransaction(
          creditTransaction.reference_number,
          cashier.staff_id
        );

        if (settlement.ok && settlement.data.success) {
          log("✓ CREDIT transaction settled successfully");
          log(
            `  Settlement reference: ${settlement.data.data.settlementTransaction.referenceNumber}`
          );
          results.push({ name: "Settle CREDIT transaction", passed: true });

          // Verify in database
          const verification = await verifySettlementInDatabase(
            creditTransaction.reference_number
          );
          if (verification.found) {
            log("✓ Settlement verified in database");
            results.push({
              name: "Verify CREDIT settlement in database",
              passed: true,
            });
          } else {
            throw new Error("Settlement not found in database");
          }
        } else {
          throw new Error(
            settlement.data.error || "Settlement failed without error message"
          );
        }
      } catch (error) {
        log(`✗ Failed to settle CREDIT transaction: ${error}`);
        results.push({
          name: "Settle CREDIT transaction",
          passed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Test 6: Prevent duplicate settlement
    if (onHoldTransaction) {
      log("\n🧪 Test 6: Prevent duplicate settlement");
      try {
        const settlement = await testSettleTransaction(
          onHoldTransaction.reference_number,
          cashier.staff_id
        );

        if (!settlement.ok && settlement.status === 409) {
          log("✓ Duplicate settlement prevented correctly");
          results.push({ name: "Prevent duplicate settlement", passed: true });
        } else {
          throw new Error("Duplicate settlement was not prevented");
        }
      } catch (error) {
        log(`✗ Duplicate settlement prevention test failed: ${error}`);
        results.push({
          name: "Prevent duplicate settlement",
          passed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Test 7: Invalid reference number
    log("\n🧪 Test 7: Handle invalid reference number");
    try {
      const settlement = await testSettleTransaction(
        "INVALID-REF-99999",
        cashier.staff_id
      );

      if (!settlement.ok && settlement.status === 404) {
        log("✓ Invalid reference handled correctly");
        results.push({ name: "Handle invalid reference", passed: true });
      } else {
        throw new Error("Invalid reference was not rejected");
      }
    } catch (error) {
      log(`✗ Invalid reference test failed: ${error}`);
      results.push({
        name: "Handle invalid reference",
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 8: Invalid cashier ID
    if (onHoldTransaction) {
      log("\n🧪 Test 8: Handle invalid cashier ID");
      // Create a new test transaction for this test
      const newTransaction = await createTestTransaction(
        "ON_HOLD",
        location.id
      );

      try {
        const settlement = await testSettleTransaction(
          newTransaction.reference_number,
          "INVALID-CASHIER-99999"
        );

        if (!settlement.ok && settlement.status === 400) {
          log("✓ Invalid cashier ID handled correctly");
          results.push({ name: "Handle invalid cashier ID", passed: true });
        } else {
          throw new Error("Invalid cashier ID was not rejected");
        }
      } catch (error) {
        log(`✗ Invalid cashier ID test failed: ${error}`);
        results.push({
          name: "Handle invalid cashier ID",
          passed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Cleanup
    log("\n🧹 Cleaning up test transactions...");
    await cleanupTestTransactions();
  } catch (error) {
    log("\n❌ Test suite failed with error:", error);
  }

  // Print summary
  log("\n" + "=".repeat(60));
  log("TEST SUMMARY");
  log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.passed ? "✓" : "✗";
    log(`${icon} ${result.name}`);
    if (!result.passed && result.error) {
      log(`  Error: ${result.error}`);
    }
  });

  log("\n" + "-".repeat(60));
  log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  log("=".repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

// Run the test suite
runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
