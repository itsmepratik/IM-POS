-- Migration: Fix types unique-constraint drift (single-column -> composite)
--
-- Drift found on the live database (2026-09-10):
--   CONSTRAINT types_category_id_name_unique UNIQUE (category_id)          -- live (wrong)
-- Every source of truth defines the composite variant:
--   lib/db/schema.ts                    -> uniqueCategoryType: unique().on(table.categoryId, table.name)
--   drizzle/meta/*.snapshot.json        -> unique columns [category_id, name]
--   20250121000000_create_types_table.sql -> CONSTRAINT types_category_name_unique UNIQUE(category_id, name)
--   supabase/cloud_schema_dump.sql:442  -> UNIQUE (category_id,name)
--
-- Impact of the drift: at most ONE type per category is allowed, so the
-- 30-row types import fails on the very first row with:
--   23505 duplicate key value violates unique constraint "types_category_id_name_unique"
--   Detail: Key (category_id)=(...) already exists.
--
-- This migration restores the intended composite UNIQUE (category_id, name).
-- Idempotent and safe to re-run. Fails loudly (no silent data change) if any
-- existing rows already violate the composite.
--
-- Apply with: supabase db push  (or run manually on the live database)

BEGIN;

DO $$
BEGIN
  -- 1) Drop the drifted single-column variant only; never touch a correct composite.
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = c.conkey[1]
    WHERE c.conrelid = 'public.types'::regclass
      AND c.conname = 'types_category_id_name_unique'
      AND c.contype = 'u'
      AND array_length(c.conkey, 1) = 1
      AND a.attname = 'category_id'
  ) THEN
    ALTER TABLE public.types DROP CONSTRAINT types_category_id_name_unique;
    RAISE NOTICE 'Dropped drifted single-column UNIQUE (category_id) on public.types';
  END IF;

  -- 2) Refuse to proceed if existing rows violate the intended composite (do not compromise).
  PERFORM 1
  FROM public.types
  GROUP BY category_id, name
  HAVING COUNT(*) > 1
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Cannot add composite UNIQUE: duplicate (category_id, name) rows already exist in public.types';
  END IF;

  -- 3) Add the intended composite constraint when missing.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.types'::regclass
      AND conname = 'types_category_id_name_unique'
      AND contype = 'u'
  ) THEN
    ALTER TABLE public.types
      ADD CONSTRAINT types_category_id_name_unique UNIQUE (category_id, name);
    RAISE NOTICE 'Added composite UNIQUE (category_id, name) on public.types';
  END IF;
END
$$;

-- Make PostgREST pick up the new constraint set immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;
