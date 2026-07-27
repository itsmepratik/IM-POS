-- Migration: Fix open_bottle_details backfill for A0181
-- Root cause: products.bottle_size was NULL at time of A0181 sale
-- The SP skipped OPEN block because COALESCE(NULL, 0) > 0 was FALSE
-- Result: no open_bottle_details row created, inventory counts incorrect

-- 1. Create missing open_bottle_details row for A0181's inventory
-- Transaction A0181: sold 1L OPEN from 4L bottle of 10W-40
-- Inventory: 54b84846-596a-44a6-a496-63c6088997e1
-- Expected: initial_volume=4, current_volume=3 (4L - 1L sold)

INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
VALUES (
  '54b84846-596a-44a6-a496-63c6088997e1',  -- inventory for 10W-40 at Saniya
  4.0,    -- bottle_size (4L bottle)
  3.0,    -- remaining volume (4L - 1L sold = 3L)
  FALSE,  -- not empty
  '2026-07-24T13:04:44.790Z'  -- opened_at = transaction time
)
ON CONFLICT DO NOTHING;

-- 2. Fix inventory counts:
-- - closed_bottles_stock: 999 -> 998 (one bottle was opened)
-- NOTE: open_bottles_stock is auto-synced by tr_sync_inventory_open_bottles_stock trigger
-- so we only need to decrement closed_bottles_stock

UPDATE inventory
SET closed_bottles_stock = closed_bottles_stock - 1
WHERE id = '54b84846-596a-44a6-a496-63c6088997e1'
  AND closed_bottles_stock >= 1;

-- 3. Verify the fix
DO $$
DECLARE
  v_obd_count INTEGER;
  v_inv RECORD;
BEGIN
  SELECT COUNT(*) INTO v_obd_count FROM open_bottle_details
  WHERE inventory_id = '54b84846-596a-44a6-a496-63c6088997e1';

  SELECT closed_bottles_stock, open_bottles_stock, standard_stock
  INTO v_inv FROM inventory
  WHERE id = '54b84846-596a-44a6-a496-63c6088997e1';

  IF v_obd_count != 1 THEN
    RAISE EXCEPTION 'Expected 1 open_bottle_details row, got %', v_obd_count;
  END IF;

  IF v_inv.open_bottles_stock != 1 THEN
    RAISE EXCEPTION 'Expected open_bottles_stock=1, got %', v_inv.open_bottles_stock;
  END IF;

  IF v_inv.closed_bottles_stock != 998 THEN
    RAISE EXCEPTION 'Expected closed_bottles_stock=998, got %', v_inv.closed_bottles_stock;
  END IF;

  RAISE NOTICE 'Fix verified: open_bottle_details=%, closed=%, open=%, standard=%',
    v_obd_count, v_inv.closed_bottles_stock, v_inv.open_bottles_stock, v_inv.standard_stock;
END $$;
