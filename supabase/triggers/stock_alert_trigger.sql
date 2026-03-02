-- =============================================================================
-- Stock Alert Trigger Function
-- Fires AFTER UPDATE on inventory table when stock columns change.
-- Inserts notifications for ALL users when:
--   1. Product goes OUT OF STOCK (total_stock transitions to 0)
--   2. Product goes LOW STOCK (total_stock transitions to at/below threshold)
-- Deduplication: Only fires on the *transition*, not on every update.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_stock_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_name TEXT;
  v_low_stock_threshold INT;
  v_location_name TEXT;
  v_old_total INT;
  v_new_total INT;
  v_user RECORD;
BEGIN
  -- Compute old and new total_stock using the same formula as the generated column
  v_old_total := COALESCE(OLD.standard_stock, 0) + COALESCE(OLD.open_bottles_stock, 0) + COALESCE(OLD.closed_bottles_stock, 0);
  v_new_total := COALESCE(NEW.standard_stock, 0) + COALESCE(NEW.open_bottles_stock, 0) + COALESCE(NEW.closed_bottles_stock, 0);

  -- Exit early if total hasn't actually changed
  IF v_old_total = v_new_total THEN
    RETURN NEW;
  END IF;

  -- Look up product name and threshold
  SELECT p.name, COALESCE(p.low_stock_threshold, 0)
    INTO v_product_name, v_low_stock_threshold
    FROM products p
   WHERE p.id = NEW.product_id;

  -- If product not found (shouldn't happen due to FK), bail out
  IF v_product_name IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up location name
  SELECT l.name
    INTO v_location_name
    FROM locations l
   WHERE l.id = NEW.location_id;

  -- =========================================================================
  -- CASE 1: OUT OF STOCK — total_stock just dropped to 0
  -- =========================================================================
  IF v_new_total = 0 AND v_old_total > 0 THEN
    FOR v_user IN
      SELECT id FROM user_profiles
    LOOP
      INSERT INTO notifications (user_id, type, title, message, category, metadata, is_read)
      VALUES (
        v_user.id,
        'error',
        'Out of Stock',
        v_product_name || ' is now out of stock at ' || COALESCE(v_location_name, 'Unknown') || '.',
        'stock',
        jsonb_build_object(
          'product_id', NEW.product_id,
          'inventory_id', NEW.id,
          'location_name', COALESCE(v_location_name, 'Unknown'),
          'current_stock', v_new_total,
          'threshold', v_low_stock_threshold,
          'alert_type', 'out_of_stock'
        ),
        false
      );
    END LOOP;

    RETURN NEW;
  END IF;

  -- =========================================================================
  -- CASE 2: LOW STOCK — total_stock just dropped to at/below threshold
  --         (but not zero, which is handled above)
  --         Only fires when crossing the threshold boundary downward.
  -- =========================================================================
  IF v_low_stock_threshold > 0
     AND v_new_total > 0
     AND v_new_total <= v_low_stock_threshold
     AND v_old_total > v_low_stock_threshold
  THEN
    FOR v_user IN
      SELECT id FROM user_profiles
    LOOP
      INSERT INTO notifications (user_id, type, title, message, category, metadata, is_read)
      VALUES (
        v_user.id,
        'warning',
        'Low Stock Alert',
        v_product_name || ' is running low at ' || COALESCE(v_location_name, 'Unknown') || '. Only ' || v_new_total || ' remaining (threshold: ' || v_low_stock_threshold || ').',
        'stock',
        jsonb_build_object(
          'product_id', NEW.product_id,
          'inventory_id', NEW.id,
          'location_name', COALESCE(v_location_name, 'Unknown'),
          'current_stock', v_new_total,
          'threshold', v_low_stock_threshold,
          'alert_type', 'low_stock'
        ),
        false
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================================================
-- Trigger: fires only when stock-related columns change
-- =============================================================================
DROP TRIGGER IF EXISTS trg_inventory_stock_alert ON inventory;

CREATE TRIGGER trg_inventory_stock_alert
  AFTER UPDATE OF standard_stock, open_bottles_stock, closed_bottles_stock
  ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION notify_stock_alert();

COMMENT ON FUNCTION public.notify_stock_alert() IS 
  'Trigger function that creates notifications for ALL users when inventory stock transitions to low-stock or out-of-stock levels. Deduplicates by only firing on threshold-crossing transitions.';
