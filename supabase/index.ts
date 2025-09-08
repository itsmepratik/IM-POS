// Supabase client exports
export { createClient } from "./client";
export { createClient as createServerClient } from "./server";
export { createAdminClient } from "./admin";

// Database types
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from "./database";
export { Constants } from "./database";
