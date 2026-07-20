-- Migration: Fix checkout - restore void columns, update stored procedure
-- This fixes the 500 error caused by parameter count mismatch

-- ── 1. Restore deleted void columns ──────────────────────────────────────

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_voided BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voided_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS void_reason TEXT;

-- ── 2. Recreate stored procedure with correct 19-param signature ────────

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
  p_reference_number TEXT DEFAULT NULL,
  p_services JSONB DEFAULT NULL
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
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_batch_deduction NUMERIC;
  v_sold_volume_per_unit NUMERIC;
  v_total_req_volume NUMERIC;
  v_bottles_to_open INTEGER;
  v_residual_open_volume NUMERIC;

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

  -- Service items variables
  v_service JSONB;
  v_service_item_id UUID;
  v_si_name TEXT;
  v_si_amount NUMERIC;
  v_si_quantity NUMERIC;
  v_si_service_id UUID;
  v_service_category TEXT;
  v_labor_split JSONB;
BEGIN
  -- Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- Reference number handling
  IF p_reference_number IS NOT NULL AND p_reference_number != '' THEN
    v_reference_number := p_reference_number;
    IF v_reference_number ~ '^WB' THEN v_ref_prefix := 'WB';
    ELSIF v_reference_number ~ '^OH' THEN v_ref_prefix := 'OH';
    ELSIF v_reference_number ~ '^ST' THEN v_ref_prefix := 'ST';
    ELSIF v_reference_number ~ '^B' THEN v_ref_prefix := 'B';
    ELSIF v_reference_number ~ '^R' THEN v_ref_prefix := 'R';
    ELSE v_ref_prefix := 'A';
    END IF;
  ELSE
    -- Check for battery sale
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
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        IF v_is_battery_sale THEN EXIT; END IF;
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

    INSERT INTO reference_number_counters (prefix, counter, updated_at)
    VALUES (v_ref_prefix, 0, NOW())
    ON CONFLICT (prefix) DO UPDATE
    SET counter = reference_number_counters.counter + 1, updated_at = NOW()
    RETURNING counter INTO v_counter;

    IF v_counter = 0 THEN
      UPDATE reference_number_counters SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
    END IF;

    v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');
  END IF;

  -- Process Items (Stock Deduction)
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

    SELECT p.name, EXISTS (
      SELECT 1 FROM products p2
      LEFT JOIN categories c ON p2.category_id = c.id
      WHERE p2.id = p.id
      AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
    ) INTO v_product_name, v_is_lubricant
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

      IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN v_bottle_size := 4.0; END IF;

      v_sold_volume_per_unit := (substring(v_volume_desc from '(^[0-9]+(\.[0-9]+)?)'))::NUMERIC;
      IF v_sold_volume_per_unit IS NULL OR v_sold_volume_per_unit = 0 THEN
        v_sold_volume_per_unit := v_bottle_size;
      END IF;

      v_total_req_volume := v_sold_volume_per_unit * v_quantity;

      IF v_item_source = 'CLOSED' THEN
        v_bottles_to_open := CEIL(v_total_req_volume / v_bottle_size)::INTEGER;
        v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_total_req_volume;
        IF v_residual_open_volume > 0 THEN
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
          ORDER BY opened_at ASC FOR UPDATE
        LOOP
          IF v_remaining_qty <= 0 THEN EXIT; END IF;
          IF v_open_bottle.current_volume >= v_remaining_qty THEN
            UPDATE open_bottle_details
            SET current_volume = current_volume - v_remaining_qty,
                is_empty = ((current_volume - v_remaining_qty) <= 0)
            WHERE id = v_open_bottle.id;
            v_remaining_qty := 0;
          ELSE
            v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
            UPDATE open_bottle_details SET current_volume = 0, is_empty = TRUE WHERE id = v_open_bottle.id;
          END IF;
        END LOOP;
        IF v_remaining_qty > 0 THEN
          v_batch_deduction := 1;
          v_new_open_vol := v_bottle_size - v_remaining_qty;
          IF v_new_open_vol < 0 THEN
            RAISE EXCEPTION 'Requested remainder (%) exceeds new bottle size (%)', v_remaining_qty, v_bottle_size;
          END IF;
          INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
          VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
        END IF;
      ELSE
        RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
      END IF;
    ELSE
      v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO)
    v_batch_remaining := v_batch_deduction;
    IF v_batch_remaining > 0 THEN
      FOR v_batch IN
        SELECT id, stock_remaining FROM batches
        WHERE inventory_id = v_inventory_id AND (is_active_batch = TRUE OR stock_remaining > 0)
        ORDER BY purchase_date ASC, batch_number ASC FOR UPDATE SKIP LOCKED
      LOOP
        IF v_batch_remaining <= 0 THEN EXIT; END IF;
        IF v_batch.stock_remaining > 0 THEN
          v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
          UPDATE batches
          SET stock_remaining = stock_remaining - v_batch_alloc,
              is_active_batch = (stock_remaining - v_batch_alloc > 0)
          WHERE id = v_batch.id;
          v_batch_remaining := v_batch_remaining - v_batch_alloc;
        END IF;
      END LOOP;

      IF NOT EXISTS (
        SELECT 1 FROM batches WHERE inventory_id = v_inventory_id AND is_active_batch = true AND stock_remaining > 0
      ) THEN
        UPDATE batches SET is_active_batch = true
        WHERE id = (
          SELECT id FROM batches WHERE inventory_id = v_inventory_id AND stock_remaining > 0
          ORDER BY purchase_date ASC, batch_number ASC LIMIT 1
        );
      END IF;
    END IF;
  END LOOP;

  -- Create Transaction Record
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    notes, created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    p_notes, NOW()
  ) RETURNING id INTO v_transaction_id;

  -- Populate service_items from cart items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      INSERT INTO service_items (transaction_id, item_type, product_id, name, quantity, unit_price, cost_price, volume_description, source)
      VALUES (v_transaction_id, 'product', v_product_id_text::UUID,
        COALESCE(v_item->>'volumeDescription', v_item->>'name', 'Unknown'),
        COALESCE((v_item->>'quantity')::NUMERIC, 1),
        COALESCE((v_item->>'sellingPrice')::NUMERIC, 0),
        COALESCE((v_item->>'costPrice')::NUMERIC, 0),
        v_item->>'volumeDescription', v_item->>'source');
    ELSE
      INSERT INTO service_items (transaction_id, item_type, name, quantity, unit_price, cost_price, volume_description)
      VALUES (v_transaction_id, 'labor',
        COALESCE(v_item->>'volumeDescription', v_item->>'name', 'Labor Service'),
        COALESCE((v_item->>'quantity')::NUMERIC, 1),
        COALESCE((v_item->>'sellingPrice')::NUMERIC, 0), 0,
        v_item->>'volumeDescription');
    END IF;
  END LOOP;

  -- Populate service_items and labor_splits from p_services
  IF p_services IS NOT NULL AND jsonb_array_length(p_services) > 0 THEN
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
    LOOP
      v_si_name := v_service->>'name';
      v_si_amount := (v_service->>'amount')::NUMERIC;
      v_si_quantity := COALESCE((v_service->>'quantity')::NUMERIC, 1);
      v_si_service_id := NULL;

      IF v_service->>'serviceId' IS NOT NULL AND v_service->>'serviceId' != '' THEN
        IF (v_service->>'serviceId') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
          v_si_service_id := (v_service->>'serviceId')::UUID;
        END IF;
      END IF;

      IF v_si_service_id IS NULL AND v_si_name IS NOT NULL THEN
        SELECT id INTO v_si_service_id FROM services
        WHERE lower(name) = lower(v_si_name) AND is_active = true LIMIT 1;
      END IF;

      v_service_category := 'service';
      IF v_si_service_id IS NOT NULL THEN
        SELECT category INTO v_service_category FROM services WHERE id = v_si_service_id;
      END IF;

      INSERT INTO service_items (transaction_id, item_type, service_id, name, quantity, unit_price, cost_price, notes)
      VALUES (v_transaction_id, COALESCE(v_service_category, 'service'), v_si_service_id,
        COALESCE(v_si_name, 'Custom Service'), v_si_quantity, v_si_amount, 0, v_service->>'description')
      RETURNING id INTO v_service_item_id;

      IF v_service->>'splits' IS NOT NULL AND jsonb_array_length((v_service->>'splits')::JSONB) > 0 THEN
        FOR v_labor_split IN SELECT * FROM jsonb_array_elements((v_service->>'splits')::JSONB)
        LOOP
          INSERT INTO labor_splits (service_item_id, staff_id, split_type, amount, percentage, description)
          VALUES (v_service_item_id,
            CASE WHEN v_labor_split->>'staffId' IS NOT NULL AND (v_labor_split->>'staffId') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
              THEN (v_labor_split->>'staffId')::UUID ELSE NULL END,
            COALESCE(v_labor_split->>'splitType', 'technician_share'),
            COALESCE((v_labor_split->>'amount')::NUMERIC, 0),
            (v_labor_split->>'percentage')::NUMERIC,
            v_labor_split->>'description');
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- Process Trade-Ins
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
    SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
    SELECT id INTO v_battery_type_id FROM types WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

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
            SELECT trade_in_value INTO v_ti_selling_price FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
            IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
            INSERT INTO products (name, category_id, type_id, description, is_battery, battery_state, cost_price)
            VALUES (v_ti_name, v_parts_category_id, v_battery_type_id,
              'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
              TRUE, LOWER(v_ti_condition), v_ti_cost_price)
            RETURNING id INTO v_ti_product_id;
          END IF;
          SELECT trade_in_value INTO v_ti_selling_price FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
          SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
          IF v_ti_inventory_id IS NOT NULL THEN
            UPDATE inventory SET selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
          ELSE
            INSERT INTO inventory (product_id, location_id, standard_stock, selling_price)
            VALUES (v_ti_product_id, p_location_id, 0, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
          END IF;
          INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch)
          VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
          INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value)
          VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
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
