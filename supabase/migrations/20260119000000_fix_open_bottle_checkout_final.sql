-- Migration: FAST_FORWARD Fix Open Bottle Checkout (Final)
-- Description: Merges Open Bottle Logic Fix with existing Trade-In and Batch Rollover Logic.
--              Replaces create_checkout_transaction with 17 arguments to match application usage.
--              CLEANUP: Drops the incorrect 16-argument overload if it exists.

DROP FUNCTION IF EXISTS create_checkout_transaction(
  UUID, UUID, UUID, JSONB, NUMERIC, TEXT, TEXT, UUID, NUMERIC, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB, -- Array of cart items
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
  p_trade_ins JSONB DEFAULT NULL -- Preserved parameter
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
  
  v_batch_deduction NUMERIC; -- NEW: Track actual batch units to deduct

  -- Trade-in variables
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
  -- 1. Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Verify location exists
  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- 2. Determine Reference Number Prefix
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        p.is_battery = TRUE OR
        p.product_type ILIKE 'battery' OR 
        p.product_type ILIKE 'batteries' OR
        (c.name = 'Parts' AND (p.product_type ILIKE 'battery' OR p.product_type ILIKE 'batteries')) OR
        p.name ILIKE '%battery%' OR
        p.name ILIKE '%batteries%'
      )
    ) INTO v_is_battery_sale;
    
    IF v_is_battery_sale THEN
      EXIT; 
    END IF;
  END LOOP;

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

  -- 3. Generate Reference Number
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

  -- 4. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; -- Reset

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type - ROBUST LUBRICANT CHECK
    -- Checks product_type AND category for keywords like 'lubricant', 'oil', 'fluid'
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        (p.product_type IS NOT NULL AND (p.product_type ILIKE 'lubricant%' OR p.product_type ILIKE 'oil%' OR p.product_type ILIKE 'fluid%')) OR
        (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%'))
      ) 
    ) INTO v_is_lubricant;

    IF v_is_lubricant THEN
        -- LUBRICANT LOGIC

        -- Resolve Bottle Size
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '^[0-9]+(\.[0-9]+)?')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        IF v_item_source = 'CLOSED' THEN
            -- [FIX]: Treat v_quantity as BOTTLE COUNT
            
            IF v_closed_bottles < v_quantity THEN
                RAISE EXCEPTION 'No closed bottles available for product % (Requested: %, Available: %)', v_product_id, v_quantity, v_closed_bottles;
            END IF;
            
            -- Deduct closed bottles
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - v_quantity::INTEGER
            WHERE id = v_inventory_id;
            
            -- Batch deduction is exactly the quantity (Bottles)
            v_batch_deduction := v_quantity;

        ELSIF v_item_source = 'OPEN' THEN
            -- [FIX]: Treat v_quantity as VOLUME (Liters)
            
            -- Consume from open bottles (FIFO)
            v_remaining_qty := v_quantity;
            
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- This bottle has enough
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    
                    if (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
                        UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                    END IF;
                    
                    v_remaining_qty := 0;
                ELSE
                    -- Drain this bottle
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                    
                    UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                END IF;
            END LOOP;
            
            -- If still need volume, open a new closed bottle (Overflow)
            IF v_remaining_qty > 0 THEN
                IF v_closed_bottles < 1 THEN
                    RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
                END IF;
                
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1 
                WHERE id = v_inventory_id;
                
                -- We cracked open 1 bottle for this sale
                v_batch_deduction := 1; 
                
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
                
                IF v_new_open_vol > 0 THEN
                   UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
                END IF;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        -- STANDARD PRODUCT
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity
        WHERE id = v_inventory_id;
        
        v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO) --
    -- Use v_batch_deduction instead of v_quantity directly
    v_batch_remaining := v_batch_deduction; -- [FIXED]
    
    -- Only process batches if there is something to deduct
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
            
            v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
            
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_alloc,
                is_active_batch = (stock_remaining - v_batch_alloc > 0)
            WHERE id = v_batch.id;
            
            v_batch_remaining := v_batch_remaining - v_batch_alloc;
        END LOOP;
        
        -- ROLLOVER LOGIC (Preserved from 20260113220000)
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
  
  -- 5. Create Transaction Record
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

  -- 6. Process Trade-Ins (Preserved)
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NULL THEN NULL; END IF;

      FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
      LOOP
          v_ti_size := v_trade_in->>'size';
          v_ti_condition := v_trade_in->>'condition';
          v_ti_name := v_trade_in->>'name';
          v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
          v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
          v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
          v_ti_product_id := NULL;
          
          IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL AND v_parts_category_id IS NOT NULL THEN
              SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
              IF v_ti_product_id IS NULL THEN
                  SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                  INSERT INTO products (
                      name, category_id, type_id, product_type, description, is_battery, battery_state, cost_price
                  ) VALUES (
                      v_ti_name, v_parts_category_id, v_battery_type_id, 'Battery',
                      'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                      TRUE, LOWER(v_ti_condition), v_ti_cost_price
                  ) RETURNING id INTO v_ti_product_id;
              END IF;
              SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
              SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
              IF v_ti_inventory_id IS NOT NULL THEN
                  UPDATE inventory SET standard_stock = standard_stock + v_ti_quantity, selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
              ELSE
                  INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, v_ti_quantity, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
              END IF;
              INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
              INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
          END IF;
      END LOOP;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;
