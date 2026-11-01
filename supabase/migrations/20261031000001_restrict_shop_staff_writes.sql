-- Migration: Restrict shops/staff writes to admins; hide secrets & HR PII
-- Date: 2026-10-31
--
-- Before: policy "staff_full_access" (ALL, USING true) let ANY signed-in
-- account — including shop-role till logins — rewrite any shop's receipt
-- header, read/overwrite shops.supervisor_password_hash (defeating void
-- authorization), and read staff salary / national id over Supabase REST.
--
-- After:
--   * SELECT stays open to authenticated (POS needs shop + cashier names).
--   * INSERT/UPDATE/DELETE require role = 'admin' (same source as middleware:
--     get_user_role_for_middleware, which only resolves the caller's own role).
--   * supervisor_password_hash and staff HR columns are not readable by the
--     client roles at all (column-level grants). The server reads them via
--     the table owner (Drizzle), which is unaffected.
--   * TRUNCATE (which bypasses RLS) is revoked from client roles everywhere.

BEGIN;

-- ── shops ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS staff_full_access ON public.shops;

CREATE POLICY shops_select_authenticated ON public.shops
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY shops_insert_admin ON public.shops
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role_for_middleware((SELECT auth.uid())) = 'admin');

CREATE POLICY shops_update_admin ON public.shops
  FOR UPDATE TO authenticated
  USING (public.get_user_role_for_middleware((SELECT auth.uid())) = 'admin')
  WITH CHECK (public.get_user_role_for_middleware((SELECT auth.uid())) = 'admin');

CREATE POLICY shops_delete_admin ON public.shops
  FOR DELETE TO authenticated
  USING (public.get_user_role_for_middleware((SELECT auth.uid())) = 'admin');

REVOKE SELECT ON public.shops FROM anon, authenticated;
GRANT SELECT (
  id, name, location_id, display_name, pos_id, shop_code, zip_code,
  brand_whatsapp, company_name, company_name_arabic, cr_number,
  address_line_1, address_line_2, address_line_3,
  address_line_arabic_1, address_line_arabic_2,
  contact_number, contact_number_arabic,
  service_description_en, service_description_ar,
  thank_you_message, thank_you_message_ar,
  brand_name, brand_address, brand_phones,
  is_active, created_at, updated_at
) ON public.shops TO authenticated;
-- The hash may only be written by the server (Drizzle, table owner).
REVOKE UPDATE (supervisor_password_hash) ON public.shops FROM authenticated;
REVOKE INSERT (supervisor_password_hash) ON public.shops FROM authenticated;

-- ── staff ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS staff_full_access ON public.staff;

CREATE POLICY staff_select_authenticated ON public.staff
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY staff_insert_admin ON public.staff
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role_for_middleware((SELECT auth.uid())) = 'admin');

CREATE POLICY staff_update_admin ON public.staff
  FOR UPDATE TO authenticated
  USING (public.get_user_role_for_middleware((SELECT auth.uid())) = 'admin')
  WITH CHECK (public.get_user_role_for_middleware((SELECT auth.uid())) = 'admin');

CREATE POLICY staff_delete_admin ON public.staff
  FOR DELETE TO authenticated
  USING (public.get_user_role_for_middleware((SELECT auth.uid())) = 'admin');

REVOKE SELECT ON public.staff FROM anon, authenticated;
GRANT SELECT (
  id, staff_id, name, email, phone, role, hire_date, profile_image_url,
  shop_id, is_active, created_at, updated_at
) ON public.staff TO authenticated;

-- ── TRUNCATE bypasses RLS: never grant it to client roles ─────────────────
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE ON TABLES FROM anon, authenticated;

COMMIT;
