import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { dbConfig } from "../config";

// Connection pool configuration
const CONNECTION_POOL_SIZE = 3; // Increased pool size for better concurrency
const CONNECTION_TIMEOUT = 15; // 15 seconds connection timeout
const IDLE_TIMEOUT = 60; // 60 seconds idle timeout
const MAX_LIFETIME = 60 * 60; // 1 hour max connection lifetime

// Initialize the database connection with enhanced error handling
let queryClient: postgres.Sql | undefined;
let db: ReturnType<typeof drizzle> | undefined;
let connectionHealth = {
  isHealthy: false,
  lastCheck: 0,
  consecutiveFailures: 0,
};

// Health check interval (5 minutes)
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;

try {
  if (dbConfig.url) {
    // Configure connection with optimized settings for reliability
    queryClient = postgres(dbConfig.url, {
      max: CONNECTION_POOL_SIZE,
      prepare: true,
      ssl: dbConfig.ssl,
      connection: {
        application_name: "pos-system",
        connect_timeout: CONNECTION_TIMEOUT * 1000, // Convert to milliseconds
        statement_timeout: 30000, // 30 second query timeout
        idle_in_transaction_session_timeout: 60000, // 1 minute idle transaction timeout
      },
      // Enhanced timeout and retry logic
      connect_timeout: CONNECTION_TIMEOUT,
      idle_timeout: IDLE_TIMEOUT,
      max_lifetime: MAX_LIFETIME,
      transform: {
        undefined: null,
      },
      // Connection retry options
      fetch_types: false, // Disable automatic type fetching for better performance
      publications: "alltables", // Enable logical replication awareness
      // Enhanced error handling
      onnotice: (notice: any) => {
        console.log("Database notice:", notice);
      },
      // Connection event handling
      onclose: () => {
        console.log("Database connection closed");
        connectionHealth.isHealthy = false;
      },
      onparameter: (key: string, value: string) => {
        console.log(`Database parameter ${key}: ${value}`);
      },
    });

    db = drizzle(queryClient, { schema });

    // Enhanced connection health monitoring
    const performHealthCheck = async () => {
      try {
        // Use a simpler query to avoid potential issues with complex queries
        const result = await queryClient!`SELECT 1 as test_value`;
        connectionHealth.isHealthy = true;
        connectionHealth.consecutiveFailures = 0;
        connectionHealth.lastCheck = Date.now();
        console.log("✅ Database health check passed");
      } catch (error) {
        connectionHealth.isHealthy = false;
        connectionHealth.consecutiveFailures++;
        connectionHealth.lastCheck = Date.now();

        console.error(
          `❌ Database health check failed (${connectionHealth.consecutiveFailures} consecutive failures):`,
          error
        );

        // Log additional connection info on repeated failures
        if (connectionHealth.consecutiveFailures >= 3) {
          console.error("Database connection details:", {
            url: dbConfig.url ? "configured" : "missing",
            ssl: dbConfig.ssl,
            poolSize: CONNECTION_POOL_SIZE,
            timeout: CONNECTION_TIMEOUT,
          });

          // Log URL format issue if detected
          if (dbConfig.url && dbConfig.url.includes("postgresql://")) {
            console.error(
              "⚠️ DATABASE_URL uses 'postgresql://' protocol. Consider using 'postgres://' for better compatibility."
            );
          }
        }
      }
    };

    // Initial health check
    void performHealthCheck();

    // Set up periodic health checks
    setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL);
  } else {
    console.warn(
      "DATABASE_URL is not configured. Database operations will fail."
    );
  }
} catch (error) {
  console.error("Failed to initialize database client:", error);
  queryClient = undefined;
  db = undefined;
  connectionHealth.isHealthy = false;
}

export { queryClient };
export { db };

// Helper function to check if database is available with health status
export function isDatabaseAvailable(): boolean {
  const isConfigured = db !== undefined && queryClient !== undefined;

  if (!isConfigured) {
    return false;
  }

  const isHealthy = connectionHealth.isHealthy;
  const recentlyChecked =
    Date.now() - connectionHealth.lastCheck < HEALTH_CHECK_INTERVAL * 2;

  // During startup (when lastCheck is 0), we assume the database is available if configured
  // This prevents 503 errors during the initial health check period
  const isStartup = connectionHealth.lastCheck === 0;

  // If configured and either healthy, recently checked, or during startup, consider available
  // Also allow if consecutive failures are low (< 5) to be more permissive for development
  const maxConsecutiveFailures = 5;
  return (
    isConfigured &&
    (isHealthy ||
      !recentlyChecked ||
      isStartup ||
      connectionHealth.consecutiveFailures < maxConsecutiveFailures)
  );
}

// Helper function to get database instance with enhanced error handling
export function getDatabase() {
  if (!isDatabaseAvailable()) {
    const errorDetails = {
      configured: db !== undefined && queryClient !== undefined,
      healthy: connectionHealth.isHealthy,
      lastCheck: new Date(connectionHealth.lastCheck).toISOString(),
      consecutiveFailures: connectionHealth.consecutiveFailures,
    };

    console.error("Database unavailable:", errorDetails);

    throw new Error(
      `Database is not available. Status: ${JSON.stringify(
        errorDetails,
        null,
        2
      )}`
    );
  }
  return db!;
}

// Helper function to get connection health status
export function getDatabaseHealth() {
  return {
    ...connectionHealth,
    isConfigured: db !== undefined && queryClient !== undefined,
    poolSize: CONNECTION_POOL_SIZE,
    lastCheckFormatted: new Date(connectionHealth.lastCheck).toISOString(),
  };
}

// Helper function to test database connection manually
// Helper function to validate DATABASE_URL format
export function validateDatabaseUrl(url?: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const dbUrl = url || dbConfig.url;
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (!dbUrl) {
    issues.push("DATABASE_URL is not configured");
    suggestions.push("Add DATABASE_URL to your environment variables");
    return { isValid: false, issues, suggestions };
  }

  try {
    const parsedUrl = new URL(dbUrl);

    // Check protocol
    if (
      parsedUrl.protocol !== "postgres:" &&
      parsedUrl.protocol !== "postgresql:"
    ) {
      issues.push(
        `Invalid protocol: ${parsedUrl.protocol}. Expected 'postgres:' or 'postgresql:'`
      );
      suggestions.push("Use 'postgres://' or 'postgresql://' as the protocol");
    }

    // Check hostname format for Supabase
    if (
      !parsedUrl.hostname.includes("supabase.co") &&
      !parsedUrl.hostname.includes("localhost")
    ) {
      issues.push(
        `Hostname ${parsedUrl.hostname} doesn't appear to be a Supabase database`
      );
      suggestions.push("Verify this is your correct Supabase database URL");
    }

    // Check port
    if (
      parsedUrl.port &&
      parsedUrl.port !== "5432" &&
      parsedUrl.port !== "6543"
    ) {
      issues.push(
        `Unusual port: ${parsedUrl.port}. Expected 5432 for standard PostgreSQL or 6543 for Supabase pooling`
      );
      suggestions.push(
        "Use port 5432 for direct connection or 6543 for connection pooling"
      );
    }

    // Check username
    if (parsedUrl.username !== "postgres") {
      issues.push(`Username ${parsedUrl.username} is not 'postgres'`);
      suggestions.push("Use 'postgres' as the username for Supabase databases");
    }

    // Check database name
    if (parsedUrl.pathname !== "/postgres") {
      issues.push(`Database name ${parsedUrl.pathname} is not '/postgres'`);
      suggestions.push("Use '/postgres' as the database name for Supabase");
    }
  } catch (error) {
    issues.push("DATABASE_URL is not a valid URL format");
    suggestions.push(
      "Check that your DATABASE_URL follows the format: postgres://username:password@host:port/database"
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
  };
}

export async function testDatabaseConnection(): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
  details?: any;
}> {
  if (!queryClient) {
    return {
      success: false,
      error: "Database client not initialized",
      details: {
        configured: !!dbConfig.url,
        ssl: dbConfig.ssl,
      },
    };
  }

  try {
    const startTime = Date.now();
    const result = await queryClient`SELECT 
      1 as test_query,
      current_timestamp as server_time,
      version() as postgres_version,
      current_database() as database_name`;
    const latency = Date.now() - startTime;

    connectionHealth.isHealthy = true;
    connectionHealth.consecutiveFailures = 0;
    connectionHealth.lastCheck = Date.now();

    return {
      success: true,
      latency,
      details: {
        serverTime: result[0]?.server_time,
        postgresVersion: result[0]?.postgres_version,
        databaseName: result[0]?.database_name,
        poolSize: CONNECTION_POOL_SIZE,
        connectionTimeout: CONNECTION_TIMEOUT,
      },
    };
  } catch (error) {
    connectionHealth.isHealthy = false;
    connectionHealth.consecutiveFailures++;
    connectionHealth.lastCheck = Date.now();

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: {
        consecutiveFailures: connectionHealth.consecutiveFailures,
        lastSuccessfulConnection: connectionHealth.lastCheck,
        errorType: error?.constructor?.name || "UnknownError",
      },
    };
  }
}
