/**
 * Columns of `public.staff` readable through the Supabase client roles.
 *
 * HR / personal fields (salary, national_id, date_of_birth, address,
 * emergency_contact, emergency_phone, notes) are revoked from the
 * `authenticated` role by migration 20261031000001; admins read them through
 * server-side Drizzle (GET /api/staff). Never `select("*")` on staff via
 * a Supabase client.
 *
 * Kept as a single string literal so supabase-js can infer the row type.
 */
export const STAFF_PUBLIC_COLUMNS =
  "id, staff_id, name, email, phone, role, hire_date, profile_image_url, shop_id, is_active, created_at, updated_at" as const;
