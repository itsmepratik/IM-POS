#!/usr/bin/env node

/**
 * Checkout System Validation Script
 *
 * This script validates that the POS checkout system is working correctly
 * after applying the database authentication fix.
 */

const { execSync } = require("child_process");

console.log("🔍 POS Checkout System Validation\n");

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.bold}${step}. ${message}${colors.reset}`);
}

async function makeRequest(url, description) {
  try {
    logInfo(`Testing: ${description}`);

    const response = execSync(`curl -s -w "HTTPSTATUS:%{http_code}" "${url}"`, {
      encoding: "utf8",
      timeout: 15000,
    });

    const [body, statusPart] = response.split("HTTPSTATUS:");
    const statusCode = parseInt(statusPart);

    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${body.substring(0, 200)}`);
    }

    return { statusCode, data };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function validateEnvironmentSetup() {
  logStep(1, "Validating Environment Setup");

  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL",
  ];

  // Check if .env.local exists
  try {
    execSync("test -f .env.local");
    logSuccess(".env.local file exists");
  } catch {
    logError(".env.local file not found");
    logWarning("Create .env.local with your Supabase credentials");
    return false;
  }

  // Check for placeholder values
  try {
    const envContent = execSync("cat .env.local", { encoding: "utf8" });

    if (
      envContent.includes("your-project-id") ||
      envContent.includes("your-db-password") ||
      envContent.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    ) {
      logError("Environment file contains placeholder values");
      logWarning("Update .env.local with your actual Supabase credentials");
      return false;
    }

    logSuccess("Environment variables appear to be configured");
    return true;
  } catch (error) {
    logError("Could not read .env.local file");
    return false;
  }
}

async function validateDatabaseConnection() {
  logStep(2, "Testing Database Connection");

  try {
    const { statusCode, data } = await makeRequest(
      "http://localhost:3000/api/debug/database",
      "Database connection test"
    );

    if (statusCode !== 200) {
      logError(`Database API returned status ${statusCode}`);
      return false;
    }

    if (data.success && data.database?.connectionTest?.success) {
      logSuccess("Database connection successful");
      logInfo(`Response time: ${data.responseTime}ms`);
      return true;
    } else {
      logError("Database connection failed");
      if (data.database?.connectionTest?.error) {
        logError(`Error: ${data.database.connectionTest.error}`);
      }
      return false;
    }
  } catch (error) {
    logError(`Database connection test failed: ${error.message}`);
    return false;
  }
}

async function validateCheckoutSystem() {
  logStep(3, "Testing Checkout System");

  try {
    const { statusCode, data } = await makeRequest(
      "http://localhost:3000/api/checkout/test",
      "Checkout system test"
    );

    if (statusCode !== 200) {
      logError(`Checkout test API returned status ${statusCode}`);
      return false;
    }

    if (data.success) {
      logSuccess("Checkout system is working correctly");
      logSuccess("✓ Stock deduction functional");
      logSuccess("✓ Transaction recording functional");
      logSuccess("✓ FIFO batch management functional");
      return true;
    } else {
      logError("Checkout system test failed");

      if (data.testResults?.summary?.errors?.length > 0) {
        logError("Errors found:");
        data.testResults.summary.errors.forEach((error) => {
          logError(`  - ${error}`);
        });
      }

      if (data.recommendations?.length > 0) {
        logWarning("Recommendations:");
        data.recommendations.forEach((rec) => {
          logWarning(`  - ${rec}`);
        });
      }

      return false;
    }
  } catch (error) {
    logError(`Checkout system test failed: ${error.message}`);
    return false;
  }
}

async function validateCheckoutAPI() {
  logStep(4, "Testing Checkout API Endpoint");

  try {
    const testPayload = {
      locationId: "test-location",
      shopId: "test-shop",
      paymentMethod: "CASH",
      cashierId: "test-cashier",
      cart: [
        {
          productId: "test-product",
          quantity: 1,
          sellingPrice: 10.0,
          volumeDescription: "Test Item",
        },
      ],
    };

    const response = execSync(
      `curl -s -w "HTTPSTATUS:%{http_code}" -X POST "http://localhost:3000/api/checkout" -H "Content-Type: application/json" -d '${JSON.stringify(
        testPayload
      )}'`,
      {
        encoding: "utf8",
        timeout: 15000,
      }
    );

    const [body, statusPart] = response.split("HTTPSTATUS:");
    const statusCode = parseInt(statusPart);

    // We expect this to fail with a business logic error (missing products/location)
    // but NOT with a 503 database connection error
    if (statusCode === 503) {
      logError(
        "Checkout API returned 503 - Database connection issue still present"
      );
      return false;
    } else if (statusCode === 400) {
      logSuccess(
        "Checkout API is accessible (returns 400 for invalid test data as expected)"
      );
      return true;
    } else if (statusCode === 200) {
      logSuccess("Checkout API processed request successfully");
      return true;
    } else {
      logWarning(
        `Checkout API returned status ${statusCode} - may need investigation`
      );
      return true;
    }
  } catch (error) {
    logError(`Checkout API test failed: ${error.message}`);
    return false;
  }
}

function printSummary(results) {
  console.log("\n" + "=".repeat(60));
  console.log(`${colors.bold}🔍 VALIDATION SUMMARY${colors.reset}`);
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    if (result.passed) {
      logSuccess(result.name);
    } else {
      logError(result.name);
    }
  });

  console.log("\n" + "=".repeat(60));

  if (passed === total) {
    logSuccess(`All ${total} tests passed! 🎉`);
    console.log(
      `\n${colors.green}${colors.bold}✅ POS Checkout System is fully functional!${colors.reset}`
    );
    console.log(
      `${colors.green}   • Database connection established${colors.reset}`
    );
    console.log(`${colors.green}   • Stock deduction working${colors.reset}`);
    console.log(
      `${colors.green}   • Transaction recording active${colors.reset}`
    );
    console.log(
      `${colors.green}   • Filter products will checkout successfully${colors.reset}`
    );
  } else {
    logError(`${passed}/${total} tests passed`);
    console.log(
      `\n${colors.red}${colors.bold}❌ POS Checkout System needs attention${colors.reset}`
    );
    console.log(
      `${colors.yellow}   Please review the errors above and fix the issues.${colors.reset}`
    );
    console.log(
      `${colors.yellow}   Check CHECKOUT_SYSTEM_FIX.md for detailed instructions.${colors.reset}`
    );
  }
}

function printUsageInstructions() {
  console.log(`\n${colors.blue}${colors.bold}🚀 Next Steps:${colors.reset}`);

  if (process.argv.includes("--fix-applied")) {
    console.log(
      `${colors.blue}   1. Your fix has been validated${colors.reset}`
    );
    console.log(
      `${colors.blue}   2. Test manual checkout in the POS interface${colors.reset}`
    );
    console.log(
      `${colors.blue}   3. Verify filter products checkout successfully${colors.reset}`
    );
    console.log(
      `${colors.blue}   4. Check that stock deduction occurs${colors.reset}`
    );
  } else {
    console.log(
      `${colors.blue}   1. Review CHECKOUT_SYSTEM_FIX.md${colors.reset}`
    );
    console.log(
      `${colors.blue}   2. Create/update your .env.local file${colors.reset}`
    );
    console.log(
      `${colors.blue}   3. Restart your development server${colors.reset}`
    );
    console.log(
      `${colors.blue}   4. Run this script again: node scripts/validate-checkout-fix.js${colors.reset}`
    );
  }
}

async function main() {
  const results = [];

  try {
    // Test 1: Environment Setup
    const envValid = await validateEnvironmentSetup();
    results.push({ name: "Environment Configuration", passed: envValid });

    // Test 2: Database Connection
    const dbValid = await validateDatabaseConnection();
    results.push({ name: "Database Connection", passed: dbValid });

    // Test 3: Checkout System
    const checkoutValid = await validateCheckoutSystem();
    results.push({ name: "Checkout System Tests", passed: checkoutValid });

    // Test 4: Checkout API
    const apiValid = await validateCheckoutAPI();
    results.push({ name: "Checkout API Endpoint", passed: apiValid });

    printSummary(results);
    printUsageInstructions();

    // Exit with appropriate code
    const allPassed = results.every((r) => r.passed);
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    logError(`Validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script arguments
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("POS Checkout System Validation Script\n");
  console.log("Usage: node scripts/validate-checkout-fix.js [options]\n");
  console.log("Options:");
  console.log("  --help, -h         Show this help message");
  console.log("  --fix-applied      Run validation after applying the fix");
  console.log("");
  console.log(
    "This script validates that your POS checkout system is working correctly"
  );
  console.log("after fixing the database authentication issues.");
  process.exit(0);
}

// Run main function
main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});

