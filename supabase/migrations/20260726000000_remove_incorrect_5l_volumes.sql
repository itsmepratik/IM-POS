-- Migration: Remove auto-generated 5L volumes from lubricants that don't natively have 5L
-- Only 15 products from the CSV had 5L in their Quantity column. Keeping 5L only for those.

BEGIN;

-- Step 1: Delete all 5L volumes from lubricant products
DELETE FROM product_volumes pv
USING products p
JOIN categories c ON p.category_id = c.id
WHERE pv.product_id = p.id
  AND c.name = 'Lubricants'
  AND pv.volume_description = '5L';

-- Step 2: Re-add 5L only for products that had it in the original CSV data
-- Prices extracted from CSV column (Selling Price) for 5L-quantity rows

-- Shell Diesel | 15W-40 R4 | selling_price: 7
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 7 FROM products WHERE name = '15W-40 R4' AND brand_id = (SELECT id FROM brands WHERE name = 'Shell');

-- Shell Diesel | 20W-50 R2 | selling_price: 7.5
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 7.5 FROM products WHERE name = '20W-50 R2' AND brand_id = (SELECT id FROM brands WHERE name = 'Shell');

-- Canroyal | 0W-20 | selling_price: 9
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 9 FROM products WHERE name = '0W-20' AND brand_id = (SELECT id FROM brands WHERE name = 'Canroyal');

-- Canroyal | 0W-16 | selling_price: 10
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 10 FROM products WHERE name = '0W-16' AND brand_id = (SELECT id FROM brands WHERE name = 'Canroyal');

-- LiquiMoly | 5W-20 | selling_price: 17
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 17 FROM products WHERE name = '5W-20' AND brand_id = (SELECT id FROM brands WHERE name = 'LiquiMoly');

-- LiquiMoly | 0W-20 | selling_price: 17
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 17 FROM products WHERE name = '0W-20' AND brand_id = (SELECT id FROM brands WHERE name = 'LiquiMoly');

-- Mopar | 5W-30 USA | selling_price: 15
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 15 FROM products WHERE name = '5W-30 USA' AND brand_id = (SELECT id FROM brands WHERE name = 'Mopar');

-- Mopar | 5W-20 USA | selling_price: 15
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 15 FROM products WHERE name = '5W-20 USA' AND brand_id = (SELECT id FROM brands WHERE name = 'Mopar');

-- Senfineco | 20W-50 | selling_price: 9.5
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 9.5 FROM products WHERE name = '20W-50' AND brand_id = (SELECT id FROM brands WHERE name = 'Senfineco');

-- Senfineco | 10W-40 | selling_price: 11
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 11 FROM products WHERE name = '10W-40' AND brand_id = (SELECT id FROM brands WHERE name = 'Senfineco');

-- Senfineco | 5W-30 | selling_price: 12
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 12 FROM products WHERE name = '5W-30' AND brand_id = (SELECT id FROM brands WHERE name = 'Senfineco');

-- Senfineco | 5W-20 | selling_price: 11
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 11 FROM products WHERE name = '5W-20' AND brand_id = (SELECT id FROM brands WHERE name = 'Senfineco');

-- Senfineco | 0W-20 | selling_price: 13
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 13 FROM products WHERE name = '0W-20' AND brand_id = (SELECT id FROM brands WHERE name = 'Senfineco');

-- Senfineco | 0W-16 | selling_price: 13
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 13 FROM products WHERE name = '0W-16' AND brand_id = (SELECT id FROM brands WHERE name = 'Senfineco');

-- Zinol | 5W-30 | selling_price: 6
INSERT INTO product_volumes (product_id, volume_description, selling_price)
SELECT id, '5L', 6 FROM products WHERE name = '5W-30' AND brand_id = (SELECT id FROM brands WHERE name = 'Zinol');

COMMIT;
