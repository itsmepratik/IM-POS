-- Migration: Add Services, Service Items, and Labor Splits
-- Description: Creates tables for service catalog, normalized line items, and labor charge splitting.
--              Backfills historical items_sold JSONB into service_items.
--              Updates checkout stored procedure to populate new tables.

-- ── 1. Create Tables ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'labor',
  default_price NUMERIC(10,3),
  estimated_duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS services_category_idx ON services(category);
CREATE INDEX IF NOT EXISTS services_name_lower_idx ON services(lower(name));

CREATE TABLE IF NOT EXISTS service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service', 'labor', 'composite')),
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,3) NOT NULL,
  cost_price NUMERIC(10,3) DEFAULT 0,
  discount_amount NUMERIC(10,3) DEFAULT 0,
  volume_description TEXT,
  source TEXT CHECK (source IN ('OPEN', 'CLOSED')),
  batch_id UUID REFERENCES batches(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_items_transaction_idx ON service_items(transaction_id);
CREATE INDEX IF NOT EXISTS service_items_product_idx ON service_items(product_id);
CREATE INDEX IF NOT EXISTS service_items_service_idx ON service_items(service_id);
CREATE INDEX IF NOT EXISTS service_items_type_idx ON service_items(item_type);

CREATE TABLE IF NOT EXISTS labor_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_item_id UUID NOT NULL REFERENCES service_items(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE RESTRICT,
  split_type TEXT NOT NULL CHECK (split_type IN ('technician_share', 'parts_portion', 'labor_portion')),
  amount NUMERIC(10,3) NOT NULL,
  percentage NUMERIC(5,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS labor_splits_service_item_idx ON labor_splits(service_item_id);
CREATE INDEX IF NOT EXISTS labor_splits_staff_idx ON labor_splits(staff_id);

-- ── 2. RLS Policies ──────────────────────────────────────────────────────

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view services" ON services
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert services" ON services
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update services" ON services
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete services" ON services
  FOR DELETE TO authenticated USING (true);

ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view service items" ON service_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert service items" ON service_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update service items" ON service_items
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete service items" ON service_items
  FOR DELETE TO authenticated USING (true);

ALTER TABLE labor_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view labor splits" ON labor_splits
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert labor splits" ON labor_splits
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update labor splits" ON labor_splits
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete labor splits" ON labor_splits
  FOR DELETE TO authenticated USING (true);

-- ── 3. Backfill Historical Data ──────────────────────────────────────────
-- Populate service_items from existing items_sold JSONB

INSERT INTO service_items (transaction_id, item_type, name, quantity, unit_price, cost_price, volume_description, source, created_at)
SELECT
  t.id,
  CASE
    WHEN item->>'productId' = '9999' THEN 'labor'
    ELSE 'product'
  END AS item_type,
  COALESCE(
    item->>'volumeDescription',
    item->>'name',
    'Unknown Item'
  ) AS name,
  COALESCE((item->>'quantity')::NUMERIC, 1) AS quantity,
  COALESCE((item->>'sellingPrice')::NUMERIC, 0) AS unit_price,
  COALESCE((item->>'costPrice')::NUMERIC, 0) AS cost_price,
  item->>'volumeDescription' AS volume_description,
  item->>'source' AS source,
  t.created_at
FROM transactions t
CROSS JOIN LATERAL jsonb_array_elements(t.items_sold) AS item
WHERE NOT t.is_voided
  AND t.items_sold IS NOT NULL
  AND jsonb_array_length(t.items_sold) > 0
  AND NOT EXISTS (
    SELECT 1 FROM service_items si WHERE si.transaction_id = t.id
  );

-- ── 4. Seed Default Service Catalog ──────────────────────────────────────

INSERT INTO services (name, name_ar, description, category, default_price) VALUES
  ('Labor - Custom Service', 'خدمة مخصصة', 'General custom labor service', 'labor', NULL),
  ('Oil Change', 'تغيير زيت', 'Full synthetic oil change service', 'labor', 3.000),
  ('Brake Disc Repair', 'إصلاح قرص الفرامل', 'Brake disc resurfacing or replacement', 'labor', 5.000),
  ('Axle Service', 'خدمة المحور', 'Axle inspection and repair', 'labor', 8.000),
  ('Tire Rotation', 'تدوير الإطارات', 'Tire rotation and balancing', 'labor', 2.000),
  ('Wheel Alignment', 'محاذاة العجلات', 'Four-wheel alignment', 'labor', 3.000),
  ('Battery Replacement', 'تبديل البطارية', 'Battery installation and testing', 'labor', 1.000),
  ('AC Service', 'خدمة التكييف', 'AC system inspection and recharge', 'labor', 4.000),
  ('Engine Diagnostic', 'تشخيص المحرك', 'Computer engine diagnostic scan', 'diagnostic', 5.000),
  ('General Inspection', 'فحص عام', 'Comprehensive vehicle inspection', 'diagnostic', 3.000)
ON CONFLICT DO NOTHING;

-- ── 5. Update Stored Procedure ───────────────────────────────────────────

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
  v_labor_split JSONB;
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

  -- 2. Determine Reference Number
  IF p_reference_number IS NOT NULL AND p_reference_number != '' THEN
    v_reference_number := p_reference_number;
    -- Determine prefix from reference number
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

    -- Generate Reference Number
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

  -- 3. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';

    -- Skip inventory logic for non-UUID items (Labor Charge, etc.)
    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
      CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED');
    v_volume_desc := v_item->>'volumeDescription';
    v_batch_deduction := 0;

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type
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
        IF v_closed_bottles < v_quantity THEN
          RAISE EXCEPTION 'No closed bottles available for product % (Requested: %, Available: %)', v_product_id, v_quantity, v_closed_bottles;
        END IF;
        UPDATE inventory
        SET closed_bottles_stock = closed_bottles_stock - v_quantity::INTEGER
        WHERE id = v_inventory_id;
        v_batch_deduction := v_quantity;
      ELSIF v_item_source = 'OPEN' THEN
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
            UPDATE open_bottle_details
            SET current_volume = current_volume - v_remaining_qty,
                is_empty = ((current_volume - v_remaining_qty) <= 0)
            WHERE id = v_open_bottle.id;
            IF (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
              UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
            END IF;
            v_remaining_qty := 0;
          ELSE
            v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
            UPDATE open_bottle_details
            SET current_volume = 0, is_empty = TRUE
            WHERE id = v_open_bottle.id;
            UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
          END IF;
        END LOOP;
        IF v_remaining_qty > 0 THEN
          IF v_closed_bottles < 1 THEN
            RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
          END IF;
          UPDATE inventory
          SET closed_bottles_stock = closed_bottles_stock - 1
          WHERE id = v_inventory_id;
          v_batch_deduction := 1;
          v_new_open_vol := v_bottle_size - v_remaining_qty;
          IF v_new_open_vol < 0 THEN
            RAISE EXCEPTION 'Requested remainder (%) exceeds new bottle size (%). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size;
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

    -- BATCH ALLOCATION (FIFO)
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
        v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
        UPDATE batches
        SET stock_remaining = stock_remaining - v_batch_alloc,
            is_active_batch = (stock_remaining - v_batch_alloc > 0)
        WHERE id = v_batch.id;
        v_batch_remaining := v_batch_remaining - v_batch_alloc;
      END LOOP;
      -- ROLLOVER LOGIC
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

  -- 4. Create Transaction Record
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

  -- 5. Populate service_items from cart items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';

    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      -- Product item
      INSERT INTO service_items (
        transaction_id, item_type, product_id, name, quantity, unit_price, cost_price, volume_description, source
      ) VALUES (
        v_transaction_id,
        'product',
        v_product_id_text::UUID,
        COALESCE(v_item->>'volumeDescription', v_item->>'name', 'Unknown'),
        COALESCE((v_item->>'quantity')::NUMERIC, 1),
        COALESCE((v_item->>'sellingPrice')::NUMERIC, 0),
        COALESCE((v_item->>'costPrice')::NUMERIC, 0),
        v_item->>'volumeDescription',
        v_item->>'source'
      );
    ELSE
      -- Service/Labor item (non-UUID, e.g. '9999')
      INSERT INTO service_items (
        transaction_id, item_type, name, quantity, unit_price, cost_price, volume_description
      ) VALUES (
        v_transaction_id,
        'labor',
        COALESCE(v_item->>'volumeDescription', v_item->>'name', 'Labor Service'),
        COALESCE((v_item->>'quantity')::NUMERIC, 1),
        COALESCE((v_item->>'sellingPrice')::NUMERIC, 0),
        0,
        v_item->>'volumeDescription'
      );
    END IF;
  END LOOP;

  -- 6. Populate service_items and labor_splits from p_services (if provided)
  IF p_services IS NOT NULL AND jsonb_array_length(p_services) > 0 THEN
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
    LOOP
      v_si_name := v_service->>'name';
      v_si_amount := (v_service->>'amount')::NUMERIC;
      v_si_quantity := COALESCE((v_service->>'quantity')::NUMERIC, 1);

      -- Resolve service_id if provided
      v_si_service_id := NULL;
      IF v_service->>'serviceId' IS NOT NULL AND v_service->>'serviceId' != '' THEN
        IF (v_service->>'serviceId') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
          v_si_service_id := (v_service->>'serviceId')::UUID;
        END IF;
      END IF;

      -- If no service_id, try to find by name
      IF v_si_service_id IS NULL AND v_si_name IS NOT NULL THEN
        SELECT id INTO v_si_service_id FROM services
        WHERE lower(name) = lower(v_si_name) AND is_active = true
        LIMIT 1;
      END IF;

      -- Determine item_type based on service category
      DECLARE
        v_service_category TEXT;
      BEGIN
        IF v_si_service_id IS NOT NULL THEN
          SELECT category INTO v_service_category FROM services WHERE id = v_si_service_id;
        END IF;

        INSERT INTO service_items (
          transaction_id, item_type, service_id, name, quantity, unit_price, cost_price, notes
        ) VALUES (
          v_transaction_id,
          COALESCE(v_service_category, 'service'),
          v_si_service_id,
          COALESCE(v_si_name, 'Custom Service'),
          v_si_quantity,
          v_si_amount,
          0,
          v_service->>'description'
        ) RETURNING id INTO v_service_item_id;

        -- Insert labor splits if provided
        IF v_service->>'splits' IS NOT NULL AND jsonb_array_length((v_service->>'splits')::JSONB) > 0 THEN
          FOR v_labor_split IN SELECT * FROM jsonb_array_elements((v_service->>'splits')::JSONB)
          LOOP
            INSERT INTO labor_splits (
              service_item_id, staff_id, split_type, amount, percentage, description
            ) VALUES (
              v_service_item_id,
              CASE WHEN v_labor_split->>'staffId' IS NOT NULL AND (v_labor_split->>'staffId') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                THEN (v_labor_split->>'staffId')::UUID
                ELSE NULL
              END,
              COALESCE(v_labor_split->>'splitType', 'technician_share'),
              COALESCE((v_labor_split->>'amount')::NUMERIC, 0),
              (v_labor_split->>'percentage')::NUMERIC,
              v_labor_split->>'description'
            );
          END LOOP;
        END IF;
      END;
    END LOOP;
  END IF;

  -- 7. Process Trade-Ins
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
