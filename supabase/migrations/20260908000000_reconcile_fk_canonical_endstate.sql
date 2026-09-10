-- Migration: Reconcile FK canonical end-state for PostgREST embeds
--
-- REVIEW PASS (2026-09-10) over pending migrations 20260904000000 and
-- 20260905000000, checked against the LIVE database and every embed hint
-- used in code (lib/services/inventoryService.ts FK constants, route handlers).
--
-- Findings:
-- * 04000000 PART 1 would CREATE duplicate `*_fkey` constraints on the live
--   DB (shops_location_id_fkey, products_category_id_fkey,
--   products_brand_id_fkey, transactions_shop_id/location_id_fkey) and
--   RE-CREATE inventory_product_id_fkey (removed by 20260907000000). Each
--   duplicate causes PGRST201 ambiguity or contradicts the canonical names
--   the app embeds name explicitly. DO NOT APPLY 04000000 AS-IS.
-- * 04000000 PART 1b is harmless today (all targets absent) but subsumed below.
-- * 04000000 PART 2 (6 RPC functions) is fully present on live (verified
--   pg_proc signatures) — nothing to do.
-- * 04000000 PART 3 (realtime publication) is fully populated — nothing to do.
-- * 04000000 line 51 (DELETE orphan product_types) is destructive in
--   principle; orphans are 0 today and no DELETE ships here.
-- * 05000000 is safe (every branch is a no-op today) but fully subsumed below.
--
-- This migration establishes the canonical end-state and nothing else:
-- * Exactly one FK per managed (table, column -> ref table) pair.
-- * Canonical names where the app embeds name them explicitly; the single
--   legacy `inventory_location_id_fkey` is kept (nothing embeds that pair,
--   and dropping it without a twin would remove enforcement).
-- * Fails loudly (no silent deletes, no silent downgrades) on orphans,
--   missing enforcement, or ambiguity.
--
-- Idempotent and safe to re-run.
-- Apply with: supabase db push  (or run manually on supabase.pratikckb.xyz)

BEGIN;

-- inventory.product_id -> products.id : ensure canonical, drop legacy twin.
-- Orphan guard first: stock records are never deleted by a migration.
DO $$
DECLARE
  orphan_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.inventory'::regclass
      AND conname = 'inventory_product_id_products_id_fk'
      AND contype = 'f'
  ) THEN
    SELECT COUNT(*) INTO orphan_count
    FROM public.inventory i
    LEFT JOIN public.products p ON p.id = i.product_id
    WHERE p.id IS NULL;

    IF orphan_count > 0 THEN
      RAISE EXCEPTION 'Cannot add canonical FK: % orphan inventory rows reference missing products', orphan_count;
    END IF;

    ALTER TABLE public.inventory
      ADD CONSTRAINT inventory_product_id_products_id_fk
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
    RAISE NOTICE 'Added canonical inventory_product_id_products_id_fk';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.inventory'::regclass
      AND conname = 'inventory_product_id_fkey'
      AND contype = 'f'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.inventory'::regclass
      AND conname = 'inventory_product_id_products_id_fk'
      AND contype = 'f'
  ) THEN
    ALTER TABLE public.inventory DROP CONSTRAINT inventory_product_id_fkey;
    RAISE NOTICE 'Dropped non-canonical inventory_product_id_fkey (canonical twin enforces the rule)';
  END IF;
END
$$;

-- Remaining pairs: drop the legacy `*_fkey` twin ONLY when the canonical
-- twin exists (so enforcement is never removed), for:
-- shops.location_id, products.category_id, products.brand_id,
-- inventory.location_id, transactions.shop_id, transactions.location_id.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      dup_con.conrelid AS dup_table,
      dup_con.conname  AS dup_name,
      keep_con.conname AS keep_name
    FROM (VALUES
      ('public.shops'::regclass,       'shops_location_id_fkey',       'shops_location_id_locations_id_fk'),
      ('public.products'::regclass,    'products_category_id_fkey',    'products_category_id_categories_id_fk'),
      ('public.products'::regclass,    'products_brand_id_fkey',       'products_brand_id_brands_id_fk'),
      ('public.inventory'::regclass,   'inventory_location_id_fkey',   'inventory_location_id_locations_id_fk'),
      ('public.transactions'::regclass,'transactions_shop_id_fkey',    'transactions_shop_id_shops_id_fk'),
      ('public.transactions'::regclass,'transactions_location_id_fkey','transactions_location_id_locations_id_fk')
    ) AS v(tbl, dup_name, keep_name)
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
      'ALTER TABLE %s DROP CONSTRAINT %I',
      r.dup_table::regclass,
      r.dup_name
    );
    RAISE NOTICE 'Dropped duplicate FK % on % (kept %)',
      r.dup_name, r.dup_table::regclass, r.keep_name;
  END LOOP;
END
$$;

-- Safety net: every managed pair must end with EXACTLY ONE single-column FK.
-- Zero means unenforced integrity; more than one means PostgREST ambiguity.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      v.tbl::regclass::text AS tbl,
      v.col AS col,
      v.reftbl::regclass::text AS reftbl,
      COUNT(c.oid) AS n,
      COALESCE(string_agg(c.conname, ', ' ORDER BY c.conname), '(none)') AS names
    FROM (VALUES
      ('public.inventory'::regclass,    'product_id'::text,  'public.products'::regclass),
      ('public.inventory'::regclass,    'location_id'::text, 'public.locations'::regclass),
      ('public.shops'::regclass,        'location_id'::text, 'public.locations'::regclass),
      ('public.products'::regclass,     'category_id'::text, 'public.categories'::regclass),
      ('public.products'::regclass,     'brand_id'::text,    'public.brands'::regclass),
      ('public.transactions'::regclass, 'shop_id'::text,     'public.shops'::regclass),
      ('public.transactions'::regclass, 'location_id'::text, 'public.locations'::regclass)
    ) AS v(tbl, col, reftbl)
    LEFT JOIN pg_constraint c
      ON c.conrelid = v.tbl
     AND c.contype = 'f'
     AND c.confrelid = v.reftbl
     AND c.conkey = ARRAY[(SELECT attnum FROM pg_attribute
                           WHERE attrelid = v.tbl AND attname = v.col)]
    GROUP BY v.tbl, v.col, v.reftbl
  LOOP
    IF r.n = 0 THEN
      RAISE EXCEPTION 'Missing FK enforcement: %.% -> % has no foreign key', r.tbl, r.col, r.reftbl;
    ELSIF r.n > 1 THEN
      RAISE EXCEPTION 'Ambiguous FKs on %.% -> %: %', r.tbl, r.col, r.reftbl, r.names;
    ELSE
      RAISE NOTICE 'OK: %.% -> % exactly one FK (%)', r.tbl, r.col, r.reftbl, r.names;
    END IF;
  END LOOP;
END
$$;

-- Realtime publication: ensure membership (idempotent, no-op when present).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cash_shifts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_shifts;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cash_shift_movements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_shift_movements;
  END IF;
END $$;

-- Make PostgREST pick up the final constraint set immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;
