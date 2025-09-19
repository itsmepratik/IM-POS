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
        await queryClient!`SELECT 1, current_timestamp as server_time`;
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
  const isHealthy = connectionHealth.isHealthy;
  const recentlyChecked =
    Date.now() - connectionHealth.lastCheck < HEALTH_CHECK_INTERVAL * 2;

  // During startup (when lastCheck is 0), we assume the database is available if configured
  // This prevents 503 errors during the initial health check period
  const isStartup = connectionHealth.lastCheck === 0;

  // If configured and either healthy, recently checked, or during startup, consider available
  // Also allow if consecutive failures are low (< 3) to be more permissive
  return isConfigured && (isHealthy || !recentlyChecked || isStartup || connectionHealth.consecutiveFailures < 3);
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
