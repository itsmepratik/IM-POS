import { NextRequest, NextResponse } from "next/server";
import {
  isDatabaseAvailable,
  getDatabaseHealth,
  testDatabaseConnection,
} from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Get basic availability status
    const isAvailable = isDatabaseAvailable();
    const healthInfo = getDatabaseHealth();

    // Perform connection test
    const connectionTest = await testDatabaseConnection();

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      responseTime,
      database: {
        available: isAvailable,
        health: healthInfo,
        connectionTest,
      },
      environment: {
        databaseUrlConfigured: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        responseTime,
        error: error instanceof Error ? error.message : "Unknown error",
        database: {
          available: false,
          health: getDatabaseHealth(),
          connectionTest: {
            success: false,
            error: error instanceof Error ? error.message : "Connection failed",
          },
        },
        environment: {
          databaseUrlConfigured: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 503 }
    );
  }
}

// Health check endpoint for external monitoring
export async function HEAD(req: NextRequest) {
  try {
    const isAvailable = isDatabaseAvailable();
    if (isAvailable) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
