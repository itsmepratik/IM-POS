-- Migration: Add canonical inventory->products FK required by PostgREST embeds
--
-- Root cause of POS outage (2026-09-10):
--   GET /rest/v1/inventory?...products!inventory_product_id_products_id_fk!inner...
--   -> 400 PGRST200 "Could not find a relationship between 'inventory' and
--      'products' in the schema cache"
-- The remote database only has inventory_product_id_fkey, but every embed in
-- lib/services/inventoryService.ts names the canonical constraint
-- inventory_product_id_products_id_fk explicitly (see FK.inventoryProduct).
-- Two FKs between the same tables would cause PGRST201 ambiguity, so this
-- migration swaps (not adds): drop the _fkey variant, add the canonical one.
-- Both enforce the identical rule (product_id -> products.id RESTRICT).
--
-- Pre-checked on the live database: 0 orphan inventory rows, so the new
-- constraint creates cleanly. Fails loudly if orphans ever appear instead
-- of deleting stock records.
--
-- Idempotent and safe to re-run.
-- Apply with: supabase db push  (or run manually on supabase.pratikckb.xyz)

BEGIN;

DO $$
DECLARE
  orphan_count integer;
BEGIN
  -- Never destroy stock records: refuse instead of cleaning orphans.
  SELECT COUNT(*) INTO orphan_count
  FROM public.inventory i
  LEFT JOIN public.products p ON p.id = i.product_id
  WHERE p.id IS NULL;

  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Cannot add canonical FK: % orphan inventory rows reference missing products', orphan_count;
  END IF;

  -- Drop the non-canonical variant (identical rule; keeps exactly one FK
  -- between inventory and products so PostgREST never sees ambiguity).
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.inventory'::regclass
      AND conname = 'inventory_product_id_fkey'
      AND contype = 'f'
  ) THEN
    ALTER TABLE public.inventory DROP CONSTRAINT inventory_product_id_fkey;
    RAISE NOTICE 'Dropped non-canonical inventory_product_id_fkey';
  END IF;

  -- Add the canonical constraint the app embeds name explicitly.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.inventory'::regclass
      AND conname = 'inventory_product_id_products_id_fk'
      AND contype = 'f'
  ) THEN
    ALTER TABLE public.inventory
      ADD CONSTRAINT inventory_product_id_products_id_fk
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
    RAISE NOTICE 'Added canonical inventory_product_id_products_id_fk';
  END IF;
END
$$;

-- Make PostgREST pick up the new constraint set immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;
