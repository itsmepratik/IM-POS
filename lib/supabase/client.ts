import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates and returns a Supabase client for browser-based applications.
 * @returns {Object} A configured Supabase client instance for browser usage.
 * @throws {Error} If environment variables are not properly set.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
