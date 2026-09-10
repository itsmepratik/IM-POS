-- REVIEW STATUS (2026-09-10): SUPERSEDED by 20260908000000_reconcile_fk_canonical_endstate.sql.
-- This file is SAFE (every branch is a no-op on the live DB today) but fully
-- subsumed: 08 contains the same conditional-drop logic plus an exactly-one-FK
-- assertion net and the realtime publication ensures. Kept for history —
-- prefer applying 08. Do NOT extend this file; extend 08 instead.
--
-- Migration: Remove duplicate FK constraints that cause PostgREST PGRST201
--
-- Root cause of POS errors:
--   "Could not embed because more than one relationship was found for
--    'shops' and 'locations'" (PGRST201) and the same for
--    'products' and 'categories' / 'brands'.
--
-- Two naming conventions exist for the same logical FKs:
--   canonical (kept):  shops_location_id_locations_id_fk,
--                      products_category_id_categories_id_fk,
--                      products_brand_id_brands_id_fk,
--                      inventory_product_id_products_id_fk,
--                      inventory_location_id_locations_id_fk
--   duplicates (dropped when the canonical one exists):
--                      shops_location_id_fkey,
--                      products_category_id_fkey,
--                      products_brand_id_fkey,
--                      inventory_product_id_fkey,
--                      inventory_location_id_fkey
--
-- This migration is idempotent and safe to re-run. The client code now uses
-- explicit FK hints AND split-query fallbacks, so it works with or without
-- this migration — but applying it removes the ambiguity at the source.
--
-- Apply with: supabase db push  (or run manually on supabase.pratikckb.xyz)

BEGIN;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      dup_con.conname  AS dup_name,
      dup_con.conrelid AS dup_table,
      keep_con.conname AS keep_name
    FROM (VALUES
      ('public.shops'::regclass,     'location_id', 'public.locations'::regclass,   'shops_location_id_fkey',             'shops_location_id_locations_id_fk'),
      ('public.products'::regclass,  'category_id', 'public.categories'::regclass,  'products_category_id_fkey',          'products_category_id_categories_id_fk'),
      ('public.products'::regclass,  'brand_id',    'public.brands'::regclass,      'products_brand_id_fkey',             'products_brand_id_brands_id_fk'),
      ('public.inventory'::regclass, 'product_id',  'public.products'::regclass,    'inventory_product_id_fkey',          'inventory_product_id_products_id_fk'),
      ('public.inventory'::regclass, 'location_id', 'public.locations'::regclass,   'inventory_location_id_fkey',         'inventory_location_id_locations_id_fk')
    ) AS v(tbl, col, reftbl, dup_name, keep_name)
    JOIN pg_constraint dup_con
      ON dup_con.conrelid = v.tbl
     AND dup_con.conname = v.dup_name
     AND dup_con.contype = 'f'
    JOIN pg_constraint keep_con
      ON keep_con.conrelid = v.tbl
     AND keep_con.conname = v.keep_name
     AND keep_con.contype = 'f'
  LOOP
    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I',
      r.dup_table::regclass,
      r.dup_name
    );
    RAISE NOTICE 'Dropped duplicate FK % on % (kept %)',
      r.dup_name, r.dup_table::regclass, r.keep_name;
  END LOOP;
END
$$;

-- Make PostgREST pick up the new constraint set immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;
