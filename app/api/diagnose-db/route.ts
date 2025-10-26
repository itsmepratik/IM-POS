import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { validateDatabaseUrl as validateDbUrl } from "@/lib/db/client";

/**
 * Comprehensive Database Diagnostic Tool
 *
 * This endpoint performs detailed diagnostics to identify and fix
 * database authentication and connection issues.
 */

interface DiagnosticResult {
  step: string;
  status: "success" | "warning" | "error";
  message: string;
  details?: any;
  solution?: string;
}

export async function GET(req: NextRequest) {
  const results: DiagnosticResult[] = [];

  try {
    // Step 1: Check environment variables
    results.push(await checkEnvironmentVariables());

    // Step 2: Validate DATABASE_URL format
    results.push(await validateDatabaseUrl());

    // Step 3: Test connection with different SSL modes
    const connectionTests = await testConnectionVariants();
    results.push(...connectionTests);

    // Step 4: Check Supabase project status
    results.push(await checkSupabaseProject());

    // Step 5: Provide specific recommendations
    const recommendations = generateRecommendations(results);

    const hasErrors = results.some((r) => r.status === "error");
    const hasWarnings = results.some((r) => r.status === "warning");

    return NextResponse.json({
      success: !hasErrors,
      message: hasErrors
        ? "Database configuration issues found. See details below."
        : hasWarnings
        ? "Database connection working with warnings. Review recommendations."
        : "Database configuration is working correctly!",
      diagnostics: results,
      recommendations,
      summary: {
        totalSteps: results.length,
        errors: results.filter((r) => r.status === "error").length,
        warnings: results.filter((r) => r.status === "warning").length,
        successes: results.filter((r) => r.status === "success").length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Diagnostic error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Diagnostic tool failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function checkEnvironmentVariables(): Promise<DiagnosticResult> {
  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    return {
      step: "Environment Variables",
      status: "error",
      message: `Missing required environment variables: ${missing.join(", ")}`,
      solution:
        "Add the missing variables to your .env.local file. See DATABASE_SETUP.md for details.",
    };
  }

  // Check DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL!;
  const urlPattern =
    /^postgres:\/\/postgres:[^@]+@db\.[^:]+\.supabase\.co:5432\/postgres/;

  if (!urlPattern.test(dbUrl)) {
    return {
      step: "Environment Variables",
      status: "warning",
      message: "DATABASE_URL format may be incorrect",
      details: {
        current: dbUrl.replace(
          /postgres:\/\/postgres:[^@]+@/,
          "postgres://postgres:***@"
        ),
        expected:
          "postgres://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres",
      },
      solution: "Verify your DATABASE_URL follows the correct Supabase format",
    };
  }

  return {
    step: "Environment Variables",
    status: "success",
    message:
      "All required environment variables are present and properly formatted",
  };
}

async function validateDatabaseUrl(): Promise<DiagnosticResult> {
  const validation = validateDbUrl();

  if (!validation.isValid) {
    return {
      step: "URL Validation",
      status: "error",
      message: `DATABASE_URL has issues: ${validation.issues.join(", ")}`,
      details: {
        currentUrl: process.env.DATABASE_URL?.replace(/:[^:@]{8,}@/, ":***@"), // Mask password
        issues: validation.issues,
        suggestions: validation.suggestions,
      },
      solution: `Fix the following issues:\n${validation.suggestions
        .map((s) => `• ${s}`)
        .join(
          "\n"
        )}\n\nGet your correct DATABASE_URL from: Supabase Dashboard → Settings → Database → Connection string`,
    };
  }

  return {
    step: "URL Validation",
    status: "success",
    message: "DATABASE_URL format is valid",
    details: {
      protocol: "postgres://",
      hostname: "supabase.co domain",
      port: "5432 or 6543",
      username: "postgres",
      database: "/postgres",
    },
  };
}

async function testConnectionVariants(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  const dbUrl = process.env.DATABASE_URL!;

  // Test 1: Default connection (with SSL require)
  try {
    const client1 = postgres(dbUrl, {
      max: 1,
      ssl: "require",
      connect_timeout: 10,
    });

    await client1`SELECT 1 as test`;
    await client1.end();

    results.push({
      step: "Connection Test (SSL require)",
      status: "success",
      message: "Database connection successful with SSL require",
    });
  } catch (error) {
    results.push({
      step: "Connection Test (SSL require)",
      status: "error",
      message: "Connection failed with SSL require",
      details: error instanceof Error ? error.message : "Unknown error",
      solution: "This is the most common issue. Check your database password.",
    });
  }

  // Test 2: Connection with SSL prefer
  try {
    const client2 = postgres(dbUrl, {
      max: 1,
      ssl: "prefer",
      connect_timeout: 10,
    });

    await client2`SELECT 1 as test`;
    await client2.end();

    results.push({
      step: "Connection Test (SSL prefer)",
      status: "success",
      message: "Database connection successful with SSL prefer",
    });
  } catch (error) {
    results.push({
      step: "Connection Test (SSL prefer)",
      status: "error",
      message: "Connection failed with SSL prefer",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 3: Connection without SSL (for debugging)
  try {
    const client3 = postgres(dbUrl, {
      max: 1,
      ssl: false,
      connect_timeout: 10,
    });

    await client3`SELECT 1 as test`;
    await client3.end();

    results.push({
      step: "Connection Test (No SSL)",
      status: "warning",
      message: "Connection works without SSL (not recommended for production)",
      solution: "Use SSL in production. This test is for debugging only.",
    });
  } catch (error) {
    results.push({
      step: "Connection Test (No SSL)",
      status: "error",
      message: "Connection failed even without SSL",
      details: error instanceof Error ? error.message : "Unknown error",
      solution:
        "This indicates a fundamental connection issue (wrong password, network, etc.)",
    });
  }

  return results;
}

async function checkSupabaseProject(): Promise<DiagnosticResult> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return {
        step: "Supabase Project Check",
        status: "error",
        message: "Missing Supabase credentials for project check",
        solution:
          "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment",
      };
    }

    // Try to make a simple API call to check if project is active
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (response.ok) {
      return {
        step: "Supabase Project Check",
        status: "success",
        message: "Supabase project is active and accessible",
      };
    } else if (response.status === 401) {
      return {
        step: "Supabase Project Check",
        status: "error",
        message: "Supabase project authentication failed",
        solution:
          "Check your SUPABASE_SERVICE_ROLE_KEY in Supabase Dashboard → Settings → API",
      };
    } else if (response.status === 404) {
      return {
        step: "Supabase Project Check",
        status: "error",
        message: "Supabase project not found or URL is incorrect",
        solution: "Verify your NEXT_PUBLIC_SUPABASE_URL in Supabase Dashboard",
      };
    } else {
      return {
        step: "Supabase Project Check",
        status: "warning",
        message: `Supabase project returned status ${response.status}`,
        solution: "Check if your Supabase project is paused or has issues",
      };
    }
  } catch (error) {
    return {
      step: "Supabase Project Check",
      status: "error",
      message: "Could not check Supabase project status",
      details: error instanceof Error ? error.message : "Unknown error",
      solution: "Check your internet connection and Supabase project URL",
    };
  }
}

function generateRecommendations(results: DiagnosticResult[]): string[] {
  const recommendations: string[] = [];
  const errors = results.filter((r) => r.status === "error");
  const warnings = results.filter((r) => r.status === "warning");

  // Check for specific error patterns
  const hasAuthError = errors.some(
    (r) =>
      r.message.toLowerCase().includes("password") ||
      r.message.toLowerCase().includes("authentication")
  );

  const hasConnectionError = errors.some(
    (r) =>
      r.message.toLowerCase().includes("connection") ||
      r.message.toLowerCase().includes("timeout")
  );

  const hasSslError = errors.some((r) =>
    r.message.toLowerCase().includes("ssl")
  );

  if (hasAuthError) {
    recommendations.push(
      "🔑 **Password Issue**: Your database password is incorrect"
    );
    recommendations.push("   → Go to Supabase Dashboard → Settings → Database");
    recommendations.push("   → Check or reset your database password");
    recommendations.push("   → Update your DATABASE_URL in .env.local");
    recommendations.push("   → Restart your development server");
  }

  if (hasConnectionError) {
    recommendations.push(
      "🌐 **Connection Issue**: Network or project access problem"
    );
    recommendations.push("   → Check your internet connection");
    recommendations.push("   → Verify your Supabase project is not paused");
    recommendations.push(
      "   → Check if your IP is blocked in Supabase Auth settings"
    );
  }

  if (hasSslError) {
    recommendations.push("🔒 **SSL Issue**: SSL configuration problem");
    recommendations.push(
      "   → Try adding ?sslmode=require to your DATABASE_URL"
    );
    recommendations.push("   → Check your Supabase project SSL settings");
  }

  if (errors.some((r) => r.step === "Environment Variables")) {
    recommendations.push(
      "⚙️ **Environment Setup**: Missing or incorrect environment variables"
    );
    recommendations.push(
      "   → Create .env.local file with all required variables"
    );
    recommendations.push("   → Follow the format in DATABASE_SETUP.md");
  }

  if (warnings.length > 0) {
    recommendations.push("⚠️ **Warnings**: Review the warning messages above");
    recommendations.push("   → Address warnings to ensure optimal performance");
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "✅ **All Good**: Your database configuration is working correctly!"
    );
    recommendations.push("   → You can now use the checkout system");
    recommendations.push("   → Consider setting up monitoring for production");
  }

  return recommendations;
}

/**
 * POST endpoint to test a specific DATABASE_URL
 * Body: { databaseUrl: "postgres://..." }
 */
export async function POST(req: NextRequest) {
  try {
    const { databaseUrl } = await req.json();

    if (!databaseUrl || typeof databaseUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "databaseUrl is required" },
        { status: 400 }
      );
    }

    // Test the provided URL
    const client = postgres(databaseUrl, {
      max: 1,
      ssl: "require",
      connect_timeout: 10,
    });

    const result =
      await client`SELECT NOW() as current_time, 'Connection successful!' as message`;
    await client.end();

    return NextResponse.json({
      success: true,
      message: "Connection test successful!",
      result: result[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        troubleshooting: {
          commonIssues: [
            "Incorrect password in connection string",
            "Wrong project ID in hostname",
            "Missing or incorrect SSL configuration",
            "Supabase project is paused or inactive",
          ],
          nextSteps: [
            "Verify the password in your connection string",
            "Check the project ID in the hostname",
            "Ensure your Supabase project is active",
            "Try the diagnostic tool: GET /api/diagnose-db",
          ],
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
