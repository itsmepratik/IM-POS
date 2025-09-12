import { NextRequest, NextResponse } from "next/server";
import { getDatabase, isDatabaseAvailable } from "@/lib/db/client";
import { locations, categories, products } from "@/lib/db/schema";

/**
 * Database Connection Test Endpoint
 *
 * Use this endpoint to test if your database connection is working properly.
 * It will attempt to connect to the database and run basic queries.
 */
export async function GET(req: NextRequest) {
  try {
    // Check if database client is available
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Database client is not available. Check your DATABASE_URL configuration.",
          details: {
            suggestion:
              "Verify your DATABASE_URL environment variable is set correctly.",
            documentation: "/DATABASE_SETUP.md",
          },
        },
        { status: 503 }
      );
    }

    const db = getDatabase();
    const testResults: any = {
      connection: null,
      tables: {},
      summary: {
        connectionWorking: false,
        tablesAccessible: 0,
        totalTablesChecked: 3,
      },
    };

    // Test 1: Basic connection
    try {
      const connectionTest = await db.execute(
        `SELECT NOW() as current_time, 'Hello POS!' as message`
      );
      testResults.connection = {
        status: "success",
        timestamp: connectionTest[0]?.current_time,
        message: connectionTest[0]?.message,
      };
      testResults.summary.connectionWorking = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown connection error";
      const isAuthError = errorMessage.includes(
        "password authentication failed"
      );

      testResults.connection = {
        status: "failed",
        error: errorMessage,
      };

      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          testResults,
          troubleshooting: {
            commonIssues: [
              "Incorrect DATABASE_URL format",
              "Wrong database password",
              "Network connectivity issues",
              "Supabase project is paused",
            ],
            nextSteps: isAuthError
              ? [
                  "🔑 PASSWORD ISSUE: Check your database password in Supabase Dashboard",
                  "Go to Settings → Database → Generate new password",
                  "Update your DATABASE_URL in .env.local",
                  "Restart your development server",
                  "Run: curl http://localhost:3000/api/diagnose-db for detailed diagnostics",
                ]
              : [
                  "Check your DATABASE_URL in .env.local",
                  "Verify your database password in Supabase dashboard",
                  "Ensure your Supabase project is active",
                  "Run: curl http://localhost:3000/api/diagnose-db for detailed diagnostics",
                ],
            diagnosticTool:
              "Use /api/diagnose-db for comprehensive diagnostics",
          },
        },
        { status: 503 }
      );
    }

    // Test 2: Table access
    const tablesToTest = [
      { name: "locations", schema: locations },
      { name: "categories", schema: categories },
      { name: "products", schema: products },
    ];

    for (const table of tablesToTest) {
      try {
        const count = await db.select().from(table.schema).limit(1);
        testResults.tables[table.name] = {
          status: "accessible",
          sampleRecords: count.length,
        };
        testResults.summary.tablesAccessible++;
      } catch (error) {
        testResults.tables[table.name] = {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown table error",
        };
      }
    }

    const allTablesAccessible =
      testResults.summary.tablesAccessible ===
      testResults.summary.totalTablesChecked;

    return NextResponse.json({
      success: testResults.summary.connectionWorking && allTablesAccessible,
      message: testResults.summary.connectionWorking
        ? allTablesAccessible
          ? "Database connection and schema are working properly!"
          : "Database connected but some tables may need setup"
        : "Database connection failed",
      testResults,
      recommendations:
        !allTablesAccessible && testResults.summary.connectionWorking
          ? [
              "Run database migrations: npm run db:migrate",
              "Check if your database schema is up to date",
              "Verify table permissions in Supabase",
            ]
          : [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database test error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isAuthError = errorMessage.includes("password authentication failed");
    const isConnectionError =
      errorMessage.includes("connection") || errorMessage.includes("timeout");

    return NextResponse.json(
      {
        success: false,
        error: "Database test failed",
        details: {
          message: errorMessage,
          type: isAuthError
            ? "authentication"
            : isConnectionError
            ? "connection"
            : "unknown",
        },
        troubleshooting: isAuthError
          ? {
              issue: "Database authentication failed",
              solution: "Check your database password in the DATABASE_URL",
              steps: [
                "Go to Supabase Dashboard → Settings → Database",
                "Check or reset your database password",
                "Update your DATABASE_URL in .env.local",
                "Restart your development server",
              ],
            }
          : isConnectionError
          ? {
              issue: "Database connection failed",
              solution: "Check your network and database availability",
              steps: [
                "Verify your internet connection",
                "Check if your Supabase project is active",
                "Verify the project ID in your DATABASE_URL",
                "Check Supabase status page for outages",
              ],
            }
          : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Test database connection with custom query
 * POST /api/test-db
 * Body: { query: "SELECT 1" }
 */
export async function POST(req: NextRequest) {
  try {
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 503 }
      );
    }

    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    // Only allow SELECT queries for security
    if (!query.trim().toLowerCase().startsWith("select")) {
      return NextResponse.json(
        { success: false, error: "Only SELECT queries are allowed" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const result = await db.execute(query);

    return NextResponse.json({
      success: true,
      result: result,
      rowCount: result.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Query execution failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
