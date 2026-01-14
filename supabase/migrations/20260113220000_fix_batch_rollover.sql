-- Migration: Fix batch active status rollover in checkout transaction
-- Description: Ensures that when an active batch is exhausted, the next available batch is automatically marked as active.

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
  p_trade_ins JSONB DEFAULT NULL -- New parameter for trade-ins
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
  -- Check for battery items in the cart to set flag
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    -- Check if product is battery or in Battery category/type
    -- Using loose matching similar to application logic
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
      EXIT; -- Found a battery, no need to check further
    END IF;
  END LOOP;

  -- Logic from getPrefixForTransaction
  IF v_is_battery_sale THEN
    v_ref_prefix := 'B';
  ELSE
    CASE UPPER(p_type)
      WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
      WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
      WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
      WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
      ELSE v_ref_prefix := 'A'; -- SALE, ON_HOLD_PAID, etc.
    END CASE;
  END IF;

  -- 3. Generate Reference Number (Atomic Increment)
  INSERT INTO reference_number_counters (prefix, counter, updated_at)
  VALUES (v_ref_prefix, 0, NOW())
  ON CONFLICT (prefix) DO UPDATE
  SET counter = reference_number_counters.counter + 1, updated_at = NOW()
  RETURNING counter INTO v_counter;

  -- Special safety to ensure we don't return 0
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
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); -- Default to CLOSED
    v_volume_desc := v_item->>'volumeDescription';

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type to determine logic
    SELECT product_type ILIKE 'lubricant' INTO v_is_lubricant
    FROM products WHERE id = v_product_id;

    IF v_is_lubricant THEN
        -- LUBRICANT LOGIC
        -- Try to extract numeric volume from product_volumes
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
            IF v_closed_bottles < 1 THEN
                RAISE EXCEPTION 'No closed bottles available for product %', v_product_id;
            END IF;
            
            -- Deduct 1 closed bottle
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - 1
            WHERE id = v_inventory_id;
            
            -- Create new open bottle with remaining volume
            v_remaining_qty := v_bottle_size - v_quantity;
            IF v_remaining_qty < 0 THEN RAISE EXCEPTION 'Requested quantity exceeds bottle size'; END IF;
            
            INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
            VALUES (v_inventory_id, v_bottle_size, v_remaining_qty, (v_remaining_qty <= 0), NOW());
            
            -- If not empty immediately, increment open stock
            IF v_remaining_qty > 0 THEN
               UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
            END IF;

        ELSIF v_item_source = 'OPEN' THEN
            -- Consume from open bottles (FIFO)
            v_remaining_qty := v_quantity;
            
            -- Loop through open bottles
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- Bottle has enough
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    
                    -- If became empty, decrement open stock
                    IF (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
                        UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                    END IF;
                    
                    v_remaining_qty := 0;
                ELSE
                    -- Bottle doesn't have enough, drain it
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                    
                    UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                END IF;
            END LOOP;
            
            -- If still need volume, open a new closed bottle
            IF v_remaining_qty > 0 THEN
                IF v_closed_bottles < 1 THEN
                    RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
                END IF;
                 -- Deduct 1 closed bottle
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1 
                WHERE id = v_inventory_id;
                
                -- Create new open bottle
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                -- Safety check
                 IF v_new_open_vol < 0 THEN RAISE EXCEPTION 'Requested remainder exceeds new bottle size'; END IF;
                 
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
        -- STANDARD PRODUCT LOGIC (Not Lubricant)
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity
        WHERE id = v_inventory_id;
    END IF;

    -- BATCH ALLOCATION (FIFO)
    v_batch_remaining := v_quantity;
    
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
        
        -- Update batch
        UPDATE batches
        SET stock_remaining = stock_remaining - v_batch_alloc,
            is_active_batch = (stock_remaining - v_batch_alloc > 0) -- Deactivate if empty
        WHERE id = v_batch.id;
        
        v_batch_remaining := v_batch_remaining - v_batch_alloc;
    END LOOP;
    
    -- ROLLOVER LOGIC: Ensure we have an active batch if stock exists
    -- This section is NEW to fix the issue where next batch doesn't activate
    IF NOT EXISTS (
        SELECT 1 FROM batches 
        WHERE inventory_id = v_inventory_id 
          AND is_active_batch = true 
          AND stock_remaining > 0
    ) THEN
        -- Activate the oldest batch that has stock
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

  END LOOP;

  -- 5. Create Transaction Record
  INSERT INTO transactions (
    reference_number,
    location_id,
    shop_id,
    cashier_id,
    type,
    total_amount,
    items_sold,
    payment_method,
    car_plate_number,
    mobile_payment_account,
    mobile_number,
    customer_id,
    discount_type,
    discount_value,
    discount_amount,
    subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number,
    p_location_id,
    p_shop_id,
    p_cashier_id,
    p_type,
    p_total_amount,
    p_items,
    p_payment_method,
    p_car_plate_number,
    p_mobile_payment_account,
    p_mobile_number,
    p_customer_id,
    p_discount_type,
    p_discount_value,
    p_discount_amount,
    p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- 6. Process Trade-Ins
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      
      -- Helper: Find Parts Category and Battery Type only once (optimization)
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NULL THEN
          NULL; 
      END IF;

      FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
      LOOP
          v_ti_size := v_trade_in->>'size';
          v_ti_condition := v_trade_in->>'condition';
          v_ti_name := v_trade_in->>'name';
          v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
          v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
          v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
          
          v_ti_product_id := NULL;
          
          -- Check if it's a battery trade-in
          IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL AND v_parts_category_id IS NOT NULL THEN
              -- 1. Find or Create Product
              
              -- Try to find by NAME first 
              SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
              
              IF v_ti_product_id IS NULL THEN
                  -- Create new product
                  SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices 
                  WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  
                  IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;

                  INSERT INTO products (
                      name, 
                      category_id, 
                      type_id, 
                      product_type, 
                      description, 
                      is_battery, 
                      battery_state, 
                      cost_price
                  ) VALUES (
                      v_ti_name,
                      v_parts_category_id,
                      v_battery_type_id,
                      'Battery',
                      'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                      TRUE,
                      LOWER(v_ti_condition), -- 'scrap' or 'resellable'
                      v_ti_cost_price
                  ) RETURNING id INTO v_ti_product_id;
                  
              END IF;

              -- 2. Find or Create Inventory
               SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices 
                  WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  
              SELECT id INTO v_ti_inventory_id 
              FROM inventory 
              WHERE product_id = v_ti_product_id AND location_id = p_location_id;

              IF v_ti_inventory_id IS NOT NULL THEN
                  UPDATE inventory 
                  SET standard_stock = standard_stock + v_ti_quantity,
                      selling_price = COALESCE(v_ti_selling_price, selling_price)
                  WHERE id = v_ti_inventory_id;
              ELSE
                  INSERT INTO inventory (product_id, location_id, standard_stock, selling_price)
                  VALUES (v_ti_product_id, p_location_id, v_ti_quantity, v_ti_selling_price)
                  RETURNING id INTO v_ti_inventory_id;
              END IF;

              -- 3. Create Batch
              INSERT INTO batches (
                  inventory_id,
                  quantity_received,
                  stock_remaining,
                  cost_price,
                  supplier,
                  is_active_batch
              ) VALUES (
                  v_ti_inventory_id,
                  v_ti_quantity,
                  v_ti_quantity,
                  v_ti_cost_price,
                  'Trade-in (' || v_ti_condition || ')',
                  TRUE
              );
              
              -- 4. Create Trade-In Transaction Record
              INSERT INTO trade_in_transactions (
                  transaction_id,
                  product_id,
                  quantity,
                  trade_in_value
              ) VALUES (
                  v_transaction_id,
                  v_ti_product_id,
                  v_ti_quantity,
                  v_ti_trade_in_value
              );
          END IF;
      END LOOP;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;
