import { z } from "zod";

// Environment configuration schema with validation
const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "Supabase publishable key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "Supabase service role key is required"),

  // Database Configuration
  DATABASE_URL: z.string().url("Invalid database URL"),

  // Application Configuration
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .optional()
    .default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

type SslMode = boolean | "require" | "prefer" | "allow";

export interface DbConfig {
  readonly url: string;
  readonly ssl: SslMode;
}

export interface SupabaseConfig {
  readonly url: string;
  readonly publishableKey: string;
  readonly serviceRoleKey: string;
}

export interface AppConfig {
  readonly url: string;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
}

/**
 * Validation is deferred to first use (runtime) rather than module load.
 * `next build` imports every route module while collecting page data, and
 * runtime-only secrets (DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY) must NOT be
 * present in the build environment. Validating eagerly would either break the
 * build or force secrets into the image layers.
 */
let cachedEnv: Env | undefined;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  cachedEnv = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  });

  return cachedEnv;
}

export function getSupabaseConfig(): SupabaseConfig {
  const env = getEnv();
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function resolveSslMode(env: Env): SslMode {
  const dbSsl = process.env.DB_SSL?.toLowerCase();
  if (dbSsl === "false" || dbSsl === "disable" || dbSsl === "off") {
    return false;
  }
  if (dbSsl === "require" || dbSsl === "true") {
    return "require";
  }
  if (dbSsl === "prefer" || dbSsl === "allow") {
    return dbSsl;
  }
  if (env.DATABASE_URL.includes("sslmode=disable")) {
    return false;
  }
  if (env.DATABASE_URL.includes("sslmode=require")) {
    return "require";
  }
  return env.NODE_ENV === "production" ? "require" : "prefer";
}

export function getDbConfig(): DbConfig {
  const env = getEnv();
  return {
    url: env.DATABASE_URL,
    ssl: resolveSslMode(env),
  };
}

export function getAppConfig(): AppConfig {
  const env = getEnv();
  return {
    url: env.NEXT_PUBLIC_APP_URL,
    isDevelopment: env.NODE_ENV === "development",
    isProduction: env.NODE_ENV === "production",
  };
}
