-- Migration: Add missing 250ml, 500ml, 5L volumes to all lubricants
-- and clean up duplicate product_volumes entries
-- Prices are calculated proportionally from existing 1L price (or derived from 4L price)

-- Step 1: Remove duplicate product_volumes (keep cheapest per product per volume_description)
DELETE FROM product_volumes
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY product_id, volume_description 
      ORDER BY selling_price ASC
    ) as rn
    FROM product_volumes
  ) ranked
  WHERE rn > 1
);

-- Step 2: Add missing 250ml volume (price = 0.25 * 1L price)
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT 
  p.id,
  '250ml',
  ROUND((COALESCE(
    (SELECT pv.selling_price FROM product_volumes pv WHERE pv.product_id = p.id AND pv.volume_description = '1L' LIMIT 1),
    (SELECT pv.selling_price / 4 FROM product_volumes pv WHERE pv.product_id = p.id AND pv.volume_description = '4L' LIMIT 1),
    0.5
  ) * 0.25)::NUMERIC, 2)
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE c.name = 'Lubricants'
  AND NOT EXISTS (
    SELECT 1 FROM product_volumes pv 
    WHERE pv.product_id = p.id AND pv.volume_description = '250ml'
  );

-- Step 3: Add missing 500ml volume (price = 0.5 * 1L price)
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT 
  p.id,
  '500ml',
  ROUND((COALESCE(
    (SELECT pv.selling_price FROM product_volumes pv WHERE pv.product_id = p.id AND pv.volume_description = '1L' LIMIT 1),
    (SELECT pv.selling_price / 4 FROM product_volumes pv WHERE pv.product_id = p.id AND pv.volume_description = '4L' LIMIT 1),
    1.0
  ) * 0.5)::NUMERIC, 2)
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE c.name = 'Lubricants'
  AND NOT EXISTS (
    SELECT 1 FROM product_volumes pv 
    WHERE pv.product_id = p.id AND pv.volume_description = '500ml'
  );

-- Step 4: Add missing 5L volume (price = 5 * 1L price)
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT 
  p.id,
  '5L',
  ROUND((COALESCE(
    (SELECT pv.selling_price FROM product_volumes pv WHERE pv.product_id = p.id AND pv.volume_description = '1L' LIMIT 1),
    (SELECT pv.selling_price / 4 FROM product_volumes pv WHERE pv.product_id = p.id AND pv.volume_description = '4L' LIMIT 1),
    2.0
  ) * 5)::NUMERIC, 2)
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE c.name = 'Lubricants'
  AND NOT EXISTS (
    SELECT 1 FROM product_volumes pv 
    WHERE pv.product_id = p.id AND pv.volume_description = '5L'
  );

-- Step 5: Verify
DO $$
DECLARE
  v_total INTEGER;
  v_250ml INTEGER;
  v_500ml INTEGER;
  v_5l INTEGER;
  v_missing INTEGER;
BEGIN
  SELECT COUNT(DISTINCT product_id) INTO v_total FROM product_volumes pv
    JOIN products p ON p.id = pv.product_id LEFT JOIN categories c ON p.category_id = c.id WHERE c.name = 'Lubricants';
  
  SELECT COUNT(DISTINCT product_id) INTO v_250ml FROM product_volumes pv
    JOIN products p ON p.id = pv.product_id LEFT JOIN categories c ON p.category_id = c.id 
    WHERE c.name = 'Lubricants' AND pv.volume_description = '250ml';
  
  SELECT COUNT(DISTINCT product_id) INTO v_500ml FROM product_volumes pv
    JOIN products p ON p.id = pv.product_id LEFT JOIN categories c ON p.category_id = c.id 
    WHERE c.name = 'Lubricants' AND pv.volume_description = '500ml';
  
  SELECT COUNT(DISTINCT product_id) INTO v_5l FROM product_volumes pv
    JOIN products p ON p.id = pv.product_id LEFT JOIN categories c ON p.category_id = c.id 
    WHERE c.name = 'Lubricants' AND pv.volume_description = '5L';
  
  v_missing := v_total - LEAST(v_250ml, v_500ml, v_5l);
  
  RAISE NOTICE 'Lubricants: % total, % have 250ml, % have 500ml, % have 5L, % still missing any',
    v_total, v_250ml, v_500ml, v_5l, v_missing;
END $$;
