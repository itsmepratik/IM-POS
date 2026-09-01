import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { dbConfig } from "../config";

// Connection pool configuration
const CONNECTION_POOL_SIZE = 10;
const CONNECTION_TIMEOUT = 15;
const IDLE_TIMEOUT = 60;
const MAX_LIFETIME = 60 * 60;

let queryClient: postgres.Sql | undefined;
let db: ReturnType<typeof drizzle> | undefined;
let connectionHealth = {
  isHealthy: false,
  lastCheck: 0,
  consecutiveFailures: 0,
};

let initialized = false;

function initializeConnection() {
  if (initialized || !dbConfig.url) return;
  initialized = true;

  try {
    queryClient = postgres(dbConfig.url, {
      max: CONNECTION_POOL_SIZE,
      prepare: false,
      ssl: dbConfig.ssl,
      application_name: "pos-system",
      connect_timeout: CONNECTION_TIMEOUT,
      max_lifetime: MAX_LIFETIME,
      idle_timeout: IDLE_TIMEOUT,
      transform: {
        undefined: null,
      },
      fetch_types: false,
      publications: "alltables",
      onnotice: () => {},
      onclose: () => {
        connectionHealth.isHealthy = false;
        setTimeout(() => void performHealthCheck(), 1000);
      },
      onparameter: () => {},
    });

    db = drizzle(queryClient, { schema });

    void performHealthCheck();
    setInterval(performHealthCheck, 5 * 60 * 1000);
  } catch (error) {
    console.error("Failed to initialize database client:", error);
    queryClient = undefined;
    db = undefined;
    connectionHealth.isHealthy = false;
  }
}

const performHealthCheck = async () => {
  if (!queryClient) return;
  try {
    await queryClient`SELECT 1 as test_value`;
    connectionHealth.isHealthy = true;
    connectionHealth.consecutiveFailures = 0;
    connectionHealth.lastCheck = Date.now();
  } catch (error) {
    connectionHealth.isHealthy = false;
    connectionHealth.consecutiveFailures++;
    connectionHealth.lastCheck = Date.now();

    if (connectionHealth.consecutiveFailures <= 10) {
      console.error(
        `❌ Database health check failed (${connectionHealth.consecutiveFailures} consecutive failures):`,
        error
      );
    }

    if (connectionHealth.consecutiveFailures === 3) {
      console.error("Database connection details:", {
        url: dbConfig.url ? "configured" : "missing",
        ssl: dbConfig.ssl,
        poolSize: CONNECTION_POOL_SIZE,
        timeout: CONNECTION_TIMEOUT,
      });
    }
  }
};

function ensureInitialized() {
  initializeConnection();
}

export { queryClient };
export { db };

// Override exports to lazy-init
export function getQueryClient() {
  ensureInitialized();
  return queryClient;
}

export function getDb() {
  ensureInitialized();
  return db;
}

export function isDatabaseAvailable(): boolean {
  ensureInitialized();
  const isConfigured = db !== undefined && queryClient !== undefined;
  if (!isConfigured) return false;

  const isHealthy = connectionHealth.isHealthy;
  const isStartup = connectionHealth.lastCheck === 0;
  const maxConsecutiveFailures = 5;
  return (
    isConfigured &&
    (isHealthy ||
      isStartup ||
      (connectionHealth.consecutiveFailures < maxConsecutiveFailures &&
        connectionHealth.consecutiveFailures === 0))
  );
}

export function getDatabase() {
  ensureInitialized();
  if (!isDatabaseAvailable()) {
    const errorDetails = {
      configured: db !== undefined && queryClient !== undefined,
      healthy: connectionHealth.isHealthy,
      lastCheck: new Date(connectionHealth.lastCheck).toISOString(),
      consecutiveFailures: connectionHealth.consecutiveFailures,
    };
    console.error("Database unavailable:", errorDetails);
    throw new Error(
      `Database is not available. Status: ${JSON.stringify(errorDetails, null, 2)}`
    );
  }
  return db!;
}

export function getDatabaseHealth() {
  return {
    ...connectionHealth,
    isConfigured: db !== undefined && queryClient !== undefined,
    poolSize: CONNECTION_POOL_SIZE,
    lastCheckFormatted: new Date(connectionHealth.lastCheck).toISOString(),
  };
}

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
    if (
      parsedUrl.protocol !== "postgres:" &&
      parsedUrl.protocol !== "postgresql:"
    ) {
      issues.push(`Invalid protocol: ${parsedUrl.protocol}. Expected 'postgres:' or 'postgresql:'`);
      suggestions.push("Use 'postgres://' or 'postgresql://' as the protocol");
    }
    if (
      !parsedUrl.hostname.includes("supabase.co") &&
      !parsedUrl.hostname.includes("sslip.io") &&
      !parsedUrl.hostname.includes("localhost") &&
      !parsedUrl.hostname.includes("127.0.0.1")
    ) {
      issues.push(`Hostname ${parsedUrl.hostname} doesn't appear to be a Supabase database`);
      suggestions.push("Verify this is your correct Supabase database URL");
    }
    if (parsedUrl.port && parsedUrl.port !== "5432" && parsedUrl.port !== "6543") {
      issues.push(`Unusual port: ${parsedUrl.port}. Expected 5432 for standard PostgreSQL or 6543 for Supabase pooling`);
      suggestions.push("Use port 5432 for direct connection or 6543 for connection pooling");
    }
    if (parsedUrl.username !== "postgres") {
      issues.push(`Username ${parsedUrl.username} is not 'postgres'`);
      suggestions.push("Use 'postgres' as the username for Supabase databases");
    }
    if (parsedUrl.pathname !== "/postgres") {
      issues.push(`Database name ${parsedUrl.pathname} is not '/postgres'`);
      suggestions.push("Use '/postgres' as the database name for Supabase");
    }
  } catch {
    issues.push("DATABASE_URL is not a valid URL format");
    suggestions.push("Check that your DATABASE_URL follows the format: postgres://username:password@host:port/database");
  }

  return { isValid: issues.length === 0, issues, suggestions };
}

export async function testDatabaseConnection(): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}> {
  const client = getQueryClient();
  if (!client) {
    return {
      success: false,
      error: "Database client not initialized",
      details: { configured: !!dbConfig.url, ssl: dbConfig.ssl },
    };
  }

  try {
    const startTime = Date.now();
    const result = await client`SELECT 
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
