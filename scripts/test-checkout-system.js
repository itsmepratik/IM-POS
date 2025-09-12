/**
 * Checkout System Test Script
 *
 * Tests various scenarios to verify the enhanced checkout system works correctly.
 * Run with: node scripts/test-checkout-system.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Test scenarios
const testScenarios = [
  {
    name: "Database Health Check",
    endpoint: "/api/debug/database",
    method: "GET",
    expectedStatus: [200, 503],
  },
  {
    name: "Normal Checkout",
    endpoint: "/api/checkout",
    method: "POST",
    body: {
      locationId: "test-location",
      shopId: "test-shop",
      paymentMethod: "CASH",
      cashierId: "test-cashier",
      cart: [
        {
          productId: "1",
          quantity: 2,
          sellingPrice: 10.5,
          volumeDescription: "Test Product",
          source: "CLOSED",
        },
      ],
    },
    expectedStatus: [200, 503],
  },
  {
    name: "Invalid Input Validation",
    endpoint: "/api/checkout",
    method: "POST",
    body: {
      // Missing required fields to test validation
      locationId: "test-location",
    },
    expectedStatus: [400],
  },
];

async function runTest(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`   ${scenario.method} ${scenario.endpoint}`);

  try {
    const response = await fetch(`${BASE_URL}${scenario.endpoint}`, {
      method: scenario.method,
      headers: {
        "Content-Type": "application/json",
      },
      ...(scenario.body && { body: JSON.stringify(scenario.body) }),
    });

    const isExpectedStatus = scenario.expectedStatus.includes(response.status);
    const statusIcon = isExpectedStatus ? "✅" : "❌";

    console.log(
      `   ${statusIcon} Status: ${response.status} ${response.statusText}`
    );

    if (response.headers.get("content-type")?.includes("application/json")) {
      const data = await response.json();

      if (data.success) {
        console.log(`   ✅ Success: ${data.success}`);
        if (data.data?.requestId) {
          console.log(`   📝 Request ID: ${data.data.requestId}`);
        }
        if (data.data?.processingTime) {
          console.log(`   ⏱️  Processing Time: ${data.data.processingTime}ms`);
        }
      } else {
        console.log(`   ❌ Error: ${data.error}`);
        if (data.details?.requestId) {
          console.log(`   📝 Request ID: ${data.details.requestId}`);
        }
        if (data.details?.errorType) {
          console.log(`   🏷️  Error Type: ${data.details.errorType}`);
        }
      }
    }

    return {
      scenario: scenario.name,
      success: isExpectedStatus,
      status: response.status,
      responseTime: 0, // Could add timing if needed
    };
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
    return {
      scenario: scenario.name,
      success: false,
      error: error.message,
    };
  }
}

async function testOfflineCapability() {
  console.log("\n🔄 Testing Offline Capability (Browser simulation)");
  console.log("   Note: This would typically be tested in the browser");
  console.log("   - Set network to offline");
  console.log("   - Attempt checkout");
  console.log("   - Verify offline storage");
  console.log("   - Restore network");
  console.log("   - Verify sync");
}

async function main() {
  console.log("🚀 Starting Checkout System Tests");
  console.log(`   Target URL: ${BASE_URL}`);

  const results = [];

  // Run API tests
  for (const scenario of testScenarios) {
    const result = await runTest(scenario);
    results.push(result);

    // Add delay between tests to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Test offline capability (informational)
  await testOfflineCapability();

  // Summary
  console.log("\n📊 Test Summary");
  console.log("================");

  const passed = results.filter((r) => r.success).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.success ? "✅" : "❌";
    console.log(`${icon} ${result.scenario}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });

  console.log(`\nTotal: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log("🎉 All tests passed! System is ready.");
  } else {
    console.log("⚠️  Some tests failed. Check the errors above.");
  }

  // Additional recommendations
  console.log("\n💡 Additional Testing Recommendations:");
  console.log("   • Test in browser with network throttling");
  console.log("   • Simulate database disconnection");
  console.log("   • Test offline transaction sync");
  console.log("   • Monitor checkout health dashboard");
  console.log("   • Test with high transaction volume");
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the tests
main().catch((error) => {
  console.error("Test runner error:", error);
  process.exit(1);
});

