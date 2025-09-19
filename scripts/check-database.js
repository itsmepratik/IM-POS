#!/usr/bin/env node

/**
 * Database Configuration Checker
 *
 * This script helps diagnose database connection issues by:
 * - Checking environment variables
 * - Validating DATABASE_URL format
 * - Testing database connectivity
 * - Providing specific recommendations
 */

const postgres = require("postgres");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

console.log("🔍 Database Configuration Diagnostic Tool\n");

// Check environment variables
console.log("📋 Environment Variables:");
console.log("  NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("  DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("  DATABASE_URL length:", process.env.DATABASE_URL?.length || 0);

if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  const preview = url.substring(0, 20) + "...";
  console.log("  DATABASE_URL preview:", preview);

  // Parse URL to check format
  try {
    const urlObj = new URL(url);
    console.log("  Protocol:", urlObj.protocol);
    console.log("  Host:", urlObj.hostname);
    console.log("  Port:", urlObj.port || "default");
    console.log("  Database:", urlObj.pathname.substring(1));
    console.log("  Username:", urlObj.username || "not specified");
    console.log("  Password:", urlObj.password ? "***" : "not specified");
  } catch (error) {
    console.log("  ❌ Invalid DATABASE_URL format:", error.message);
  }
} else {
  console.log("  ❌ DATABASE_URL is not set");
}

console.log("\n🔌 Testing Database Connection...");

if (!process.env.DATABASE_URL) {
  console.log("❌ Cannot test connection - DATABASE_URL not set");
  console.log("\n📝 Recommendations:");
  console.log("  1. Create a .env.local file in your project root");
  console.log("  2. Add your DATABASE_URL:");
  console.log(
    "     DATABASE_URL=postgresql://username:password@host:port/database"
  );
  console.log("  3. For Supabase:");
  console.log(
    "     DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres"
  );
  process.exit(1);
}

// Test database connection
async function testConnection() {
  let client;

  try {
    console.log("  Attempting to connect...");

    client = postgres(process.env.DATABASE_URL, {
      max: 1,
      prepare: true,
      ssl: process.env.NODE_ENV === "production" ? "require" : "prefer",
      connection: {
        application_name: "pos-diagnostic",
      },
      connect_timeout: 10,
    });

    // Test basic query
    const result =
      await client`SELECT 1 as test, NOW() as current_time, version() as postgres_version`;
    console.log("  ✅ Connection successful!");
    console.log("  📊 Test result:", result[0]);

    // Test schema access
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log("  📋 Available tables:", tables.length);
    if (tables.length > 0) {
      console.log("     Tables:", tables.map((t) => t.table_name).join(", "));
    }

    // Test transaction
    await client.transaction(async (tx) => {
      await tx`SELECT 1`;
    });
    console.log("  ✅ Transaction test passed");

    console.log("\n🎉 Database connection is working correctly!");
    console.log("   Your POS system should be able to process checkouts.");
  } catch (error) {
    console.log("  ❌ Connection failed:", error.message);

    console.log("\n🔧 Troubleshooting:");

    if (error.message.includes("password authentication failed")) {
      console.log("  🔑 Authentication failed:");
      console.log("     - Check your username and password");
      console.log("     - Verify the user has proper permissions");
      console.log("     - For Supabase: Check your project settings");
    }

    if (error.message.includes("connection refused")) {
      console.log("  🌐 Connection refused:");
      console.log("     - Check if the database server is running");
      console.log("     - Verify the host and port are correct");
      console.log("     - Check firewall settings");
    }

    if (error.message.includes("timeout")) {
      console.log("  ⏱️ Connection timeout:");
      console.log("     - Check your network connection");
      console.log("     - Verify the database server is responsive");
      console.log("     - Try increasing the timeout value");
    }

    if (error.message.includes("SSL")) {
      console.log("  🔒 SSL error:");
      console.log("     - Check SSL configuration");
      console.log("     - Try adding ?sslmode=require to your URL");
      console.log("     - For local development, try ?sslmode=disable");
    }

    if (
      error.message.includes("database") &&
      error.message.includes("does not exist")
    ) {
      console.log("  🗄️ Database not found:");
      console.log("     - Check the database name in your URL");
      console.log("     - Create the database if it doesn't exist");
      console.log(
        '     - For Supabase: The database name is usually "postgres"'
      );
    }

    console.log("\n📝 Next Steps:");
    console.log("  1. Fix the issue above");
    console.log("  2. Run this script again to verify");
    console.log("  3. Test your POS system");
  } finally {
    if (client) {
      await client.end();
    }
  }
}

testConnection().catch(console.error);









