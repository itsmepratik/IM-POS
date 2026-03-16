-- Migration: Fix Standard Stock Sum
-- Description: Ensures standard_stock equals closed_bottles_stock + open_bottles_stock for lubricants.

-- 1. Create a unified trigger function
CREATE OR REPLACE FUNCTION sync_inventory_from_batches_and_open_bottles()
RETURNS TRIGGER AS $$
DECLARE
  v_is_lubricant BOOLEAN;
  v_total_batch_stock INTEGER;
  v_open_bottles INTEGER;
  v_inv_id UUID;
BEGIN
  v_inv_id := COALESCE(NEW.inventory_id, OLD.inventory_id);

  SELECT EXISTS (
    SELECT 1 FROM products p
    JOIN inventory i ON i.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE i.id = v_inv_id
    AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
  ) INTO v_is_lubricant;

  -- Always calculate batches stock
  SELECT COALESCE(SUM(stock_remaining), 0)
  INTO v_total_batch_stock
  FROM batches
  WHERE inventory_id = v_inv_id;

  IF v_is_lubricant THEN
    -- Calculate open bottles
    SELECT COUNT(*)
    INTO v_open_bottles
    FROM open_bottle_details
    WHERE inventory_id = v_inv_id
    AND is_empty = FALSE;

    UPDATE inventory
    SET closed_bottles_stock = v_total_batch_stock,
        open_bottles_stock = v_open_bottles,
        standard_stock = v_total_batch_stock + v_open_bottles
    WHERE id = v_inv_id;
  ELSE
    UPDATE inventory
    SET standard_stock = v_total_batch_stock
    WHERE id = v_inv_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Bind unified function to both triggers
DROP TRIGGER IF EXISTS tr_sync_inventory_from_batches ON batches;
CREATE TRIGGER tr_sync_inventory_from_batches
AFTER INSERT OR UPDATE OF stock_remaining OR DELETE ON batches
FOR EACH ROW
EXECUTE FUNCTION sync_inventory_from_batches_and_open_bottles();

DROP TRIGGER IF EXISTS tr_sync_inventory_from_open_bottles ON open_bottle_details;
CREATE TRIGGER tr_sync_inventory_from_open_bottles
AFTER INSERT OR UPDATE OF is_empty OR DELETE ON open_bottle_details
FOR EACH ROW
EXECUTE FUNCTION sync_inventory_from_batches_and_open_bottles();

-- 3. Update existing inventory standard_stock data
UPDATE inventory i
SET standard_stock = COALESCE(closed_bottles_stock, 0) + COALESCE(open_bottles_stock, 0)
WHERE EXISTS (
  SELECT 1 FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.id = i.product_id
  AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
);

-- 4. Clean up create_checkout_transaction by removing redundant UPDATE inventory queries
CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_product_id_text TEXT;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_sold_volume_per_unit NUMERIC;
  v_total_req_volume NUMERIC;
  v_bottles_to_open INTEGER;
  v_residual_open_volume NUMERIC;
  v_batch_deduction NUMERIC;
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_product_id := v_product_id_text::UUID;
        SELECT EXISTS (
          SELECT 1 FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = v_product_id
          AND (
            p.is_battery = TRUE OR
            (c.name = 'Parts' AND (p.name ILIKE '%battery%' OR p.name ILIKE '%batteries%')) OR
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        
        IF v_is_battery_sale THEN
          EXIT; 
        END IF;
    END IF;
  END LOOP;

  IF p_reference_number IS NOT NULL AND p_reference_number != '' THEN
    v_reference_number := p_reference_number;
  ELSE
    IF v_is_battery_sale THEN
      v_ref_prefix := 'B';
    ELSE
      CASE UPPER(p_type)
        WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
        WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
        WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
        WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
        ELSE v_ref_prefix := 'A';
      END CASE;
    END IF;

    INSERT INTO reference_number_counters (prefix, counter, updated_at)
    VALUES (v_ref_prefix, 0, NOW())
    ON CONFLICT (prefix) DO UPDATE
    SET counter = reference_number_counters.counter + 1, updated_at = NOW()
    RETURNING counter INTO v_counter;

    IF v_counter = 0 THEN
        UPDATE reference_number_counters
        SET counter = 1, updated_at = NOW()
        WHERE prefix = v_ref_prefix AND counter = 0
        RETURNING counter INTO v_counter;
    END IF;

    v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
        CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; 

    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    SELECT 
        p.name,
        EXISTS (
            SELECT 1 FROM products p2
            LEFT JOIN categories c ON p2.category_id = c.id
            WHERE p2.id = p.id
            AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
        )
    INTO v_product_name, v_is_lubricant
    FROM products p WHERE p.id = v_product_id;

    IF v_is_lubricant THEN
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '(^[0-9]+(\.[0-9]+)?)')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        v_sold_volume_per_unit := (substring(v_volume_desc from '(^[0-9]+(\.[0-9]+)?)'))::NUMERIC;
        IF v_sold_volume_per_unit IS NULL OR v_sold_volume_per_unit = 0 THEN
             v_sold_volume_per_unit := v_bottle_size;
        END IF;

        v_total_req_volume := v_sold_volume_per_unit * v_quantity;

        IF v_item_source = 'CLOSED' THEN
            v_bottles_to_open := CEIL(v_total_req_volume / v_bottle_size)::INTEGER;
            
            v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_total_req_volume;
            IF v_residual_open_volume > 0 THEN
                 -- This insertion fires the trigger to increment open bottles
                 INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                 VALUES (v_inventory_id, v_bottle_size, v_residual_open_volume, FALSE, NOW());
            END IF;
            
            v_batch_deduction := v_bottles_to_open;
            
        ELSIF v_item_source = 'OPEN' THEN
            v_remaining_qty := v_total_req_volume; 
            
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- These updates fire the trigger to decrement open bottles (if emptied)
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    v_remaining_qty := 0;
                ELSE
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                END IF;
            END LOOP;
            
            IF v_remaining_qty > 0 THEN
                v_batch_deduction := 1; 
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                -- This insertion fires the trigger to increment open bottles over writing any empties
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO) --
    v_batch_remaining := v_batch_deduction; 
    
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC, batch_number ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            IF v_batch.stock_remaining > 0 THEN
                v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
                -- This update fires the trigger to update batches sum and standard stock
                UPDATE batches
                SET stock_remaining = stock_remaining - v_batch_alloc,
                    is_active_batch = (stock_remaining - v_batch_alloc > 0)
                    WHERE id = v_batch.id;
                v_batch_remaining := v_batch_remaining - v_batch_alloc;
            END IF;
        END LOOP;
        
        IF v_batch_remaining > 0 THEN
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_remaining,
                is_active_batch = TRUE
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id
                ORDER BY purchase_date DESC, batch_number DESC
                LIMIT 1
            );
            
            IF NOT FOUND THEN
                INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, is_active_batch, batch_number)
                VALUES (v_inventory_id, 0, -v_batch_remaining, 0, TRUE, 1);
            END IF;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM batches 
            WHERE inventory_id = v_inventory_id 
              AND is_active_batch = true 
              AND stock_remaining > 0
        ) THEN
            UPDATE batches
            SET is_active_batch = true
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id 
                  AND stock_remaining > 0
                ORDER BY purchase_date ASC, batch_number ASC
                LIMIT 1
            );
        END IF;
    END IF;

  END LOOP;
  
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NOT NULL THEN
          FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
          LOOP
              v_ti_size := v_trade_in->>'size';
              v_ti_condition := v_trade_in->>'condition';
              v_ti_name := v_trade_in->>'name';
              v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
              v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
              v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
              v_ti_product_id := NULL;
              
              IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL THEN
                  SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
                  IF v_ti_product_id IS NULL THEN
                      SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                      IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                      INSERT INTO products (
                          name, category_id, type_id, description, is_battery, battery_state, cost_price
                      ) VALUES (
                          v_ti_name, v_parts_category_id, v_battery_type_id, 
                          'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                          TRUE, LOWER(v_ti_condition), v_ti_cost_price
                      ) RETURNING id INTO v_ti_product_id;
                  END IF;
                  SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
                  IF v_ti_inventory_id IS NOT NULL THEN
                      UPDATE inventory SET selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  ELSE
                      INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, 0, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  END IF;
                  
                  INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
              END IF;
          END LOOP;
      END IF;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;
