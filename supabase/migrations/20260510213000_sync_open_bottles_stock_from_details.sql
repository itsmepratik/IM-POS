-- Migration: Sync inventory.open_bottles_stock from open_bottle_details
-- Problem: inventory.open_bottles_stock can drift and show 0 while the UI correctly
--          derives open bottles from open_bottle_details (is_empty = false).
-- Fix: Maintain inventory.open_bottles_stock as a cached count of non-empty open bottles.

-- 1) Backfill existing rows
UPDATE public.inventory i
SET open_bottles_stock = COALESCE(ob.open_count, 0)
FROM (
  SELECT inventory_id, COUNT(*)::INTEGER AS open_count
  FROM public.open_bottle_details
  WHERE is_empty = FALSE
  GROUP BY inventory_id
) ob
WHERE i.id = ob.inventory_id;

-- Ensure inventories with no open bottles are set to 0
UPDATE public.inventory
SET open_bottles_stock = 0
WHERE open_bottles_stock IS NULL;

-- 2) Trigger function to sync the cached count
CREATE OR REPLACE FUNCTION public.sync_inventory_open_bottles_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_new_inv_id UUID;
  v_old_inv_id UUID;
BEGIN
  v_new_inv_id := COALESCE(NEW.inventory_id, NULL);
  v_old_inv_id := COALESCE(OLD.inventory_id, NULL);

  -- Recalculate for NEW.inventory_id when present (INSERT/UPDATE)
  IF v_new_inv_id IS NOT NULL THEN
    UPDATE public.inventory
    SET open_bottles_stock = (
      SELECT COUNT(*)::INTEGER
      FROM public.open_bottle_details
      WHERE inventory_id = v_new_inv_id
        AND is_empty = FALSE
    )
    WHERE id = v_new_inv_id;
  END IF;

  -- If inventory_id changed (or DELETE), recalc the OLD one too
  IF v_old_inv_id IS NOT NULL AND v_old_inv_id IS DISTINCT FROM v_new_inv_id THEN
    UPDATE public.inventory
    SET open_bottles_stock = (
      SELECT COUNT(*)::INTEGER
      FROM public.open_bottle_details
      WHERE inventory_id = v_old_inv_id
        AND is_empty = FALSE
    )
    WHERE id = v_old_inv_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3) Trigger on open_bottle_details mutations
DROP TRIGGER IF EXISTS trg_sync_inventory_open_bottles_stock ON public.open_bottle_details;

CREATE TRIGGER trg_sync_inventory_open_bottles_stock
AFTER INSERT OR UPDATE OR DELETE ON public.open_bottle_details
FOR EACH ROW
EXECUTE FUNCTION public.sync_inventory_open_bottles_stock();

