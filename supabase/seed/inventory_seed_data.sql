-- Inventory seed data
-- This file populates the database with initial inventory data

-- Insert locations (branches)
INSERT INTO public.locations (name, address) VALUES
    ('Sanaiya', 'Sanaiya Industrial Area, Abu Dhabi'),
    ('Abu Dhabi Branch', '123 Main St, Abu Dhabi'),
    ('Hafeet Branch', '456 Center Ave, Al Ain'),
    ('West Side Branch', '789 West Blvd, Abu Dhabi')
ON CONFLICT (name) DO NOTHING;

-- Insert categories
INSERT INTO public.categories (name, description) VALUES
    ('Lubricants', 'Engine oils and lubricants'),
    ('Filters', 'Air, oil, and fuel filters'),
    ('Brakes', 'Brake pads, discs, and components'),
    ('Batteries', 'Car batteries and accessories'),
    ('Additives', 'Fuel additives and fluids'),
    ('Parts', 'General automotive parts')
ON CONFLICT (name) DO NOTHING;

-- Insert suppliers
INSERT INTO public.suppliers (name, contact, email, phone, address) VALUES
    ('AutoSupply Co.', 'John Doe', 'john@autosupply.com', '+971 50 123 4567', 'Industrial Area, Abu Dhabi'),
    ('Gulf Parts Ltd.', 'Jane Smith', 'jane@gulfparts.com', '+971 50 765 4321', 'Al Quoz, Dubai'),
    ('OEM Direct', 'Mohammed Ali', 'mali@oemdirect.com', '+971 50 987 6543', 'Sharjah Industrial Area'),
    ('Premium Auto Parts', 'Ahmed Hassan', 'ahmed@premiumauto.com', '+971 50 555 1234', 'Musaffah, Abu Dhabi')
ON CONFLICT DO NOTHING;

-- Insert brands first (ensure they exist before products)
INSERT INTO public.brands (name)
SELECT unnest(ARRAY[
    'Castrol', 'Mobil', 'Shell', 'Bosch', 'Mann', 'Toyota', 'Brembo',
    'Yuasa', 'Prestone', 'STP', 'NGK', 'Gates', 'Mann-Filter'
])
ON CONFLICT (name) DO NOTHING;

-- Insert products
WITH category_ids AS (
    SELECT id, name FROM public.categories
),
brand_ids AS (
    SELECT id, name FROM public.brands
)
INSERT INTO public.products (name, category_id, brand_id, product_type, description, is_oil, low_stock_threshold)
SELECT
    p.name,
    c.id as category_id,
    b.id as brand_id,
    p.product_type,
    p.description,
    p.is_oil,
    p.low_stock_threshold
FROM (
    VALUES
        ('Engine Lubricant 5W-30', 'Lubricants', 'Castrol', 'Synthetic', 'Fully synthetic engine oil for modern engines', true, 10),
        ('Engine Lubricant 10W-40', 'Lubricants', 'Mobil', 'Semi-Synthetic', 'Semi-synthetic engine oil for older engines', true, 10),
        ('Gear Oil 75W-90', 'Lubricants', 'Shell', 'Synthetic', 'High performance gear oil', true, 5),
        ('Air Filter Premium', 'Filters', 'Bosch', 'Premium', 'High-performance air filter', false, 5),
        ('Oil Filter Standard', 'Filters', 'Mann', 'Standard', 'Standard oil filter', false, 8),
        ('Fuel Filter', 'Filters', 'Bosch', 'Standard', 'Fuel system filter', false, 6),
        ('Brake Pads Set', 'Brakes', 'Toyota', 'OEM', 'Original equipment brake pads', false, 3),
        ('Brake Discs', 'Brakes', 'Brembo', 'Performance', 'High performance brake discs', false, 2),
        ('Car Battery 12V', 'Batteries', 'Bosch', 'Lead Acid', '12V car battery with 2-year warranty', false, 2),
        ('Motorcycle Battery', 'Batteries', 'Yuasa', 'Lead Acid', '12V motorcycle battery', false, 3),
        ('Coolant Green', 'Additives', 'Prestone', 'Coolant', 'Ethylene glycol coolant', false, 8),
        ('Fuel System Cleaner', 'Additives', 'STP', 'Additive', 'Fuel injector cleaner', false, 10),
        ('Spark Plugs Set', 'Parts', 'NGK', 'Ignition', 'Iridium spark plugs set of 4', false, 5),
        ('Timing Belt', 'Parts', 'Gates', 'Belt', 'Engine timing belt', false, 3)
) AS p(name, category_name, brand_name, product_type, description, is_oil, low_stock_threshold)
LEFT JOIN category_ids c ON c.name = p.category_name
LEFT JOIN brand_ids b ON b.name = p.brand_name
WHERE NOT EXISTS (
    SELECT 1 FROM public.products pr WHERE pr.name = p.name
);

-- Insert inventory for Sanaiya location
WITH sanaiya_location AS (
    SELECT id FROM public.locations WHERE name = 'Sanaiya' LIMIT 1
),
product_data AS (
    SELECT id, name, is_oil FROM public.products
)
INSERT INTO public.inventory (product_id, location_id, standard_stock, selling_price, cost_price, open_bottles_stock, closed_bottles_stock, is_battery)
SELECT 
    p.id,
    s.id as location_id,
    CASE 
        WHEN p.name LIKE '%Engine Lubricant 5W-30%' THEN 0
        WHEN p.name LIKE '%Engine Lubricant 10W-40%' THEN 0
        WHEN p.name LIKE '%Gear Oil%' THEN 0
        WHEN p.name LIKE '%Air Filter%' THEN 25
        WHEN p.name LIKE '%Oil Filter%' THEN 30
        WHEN p.name LIKE '%Fuel Filter%' THEN 20
        WHEN p.name LIKE '%Brake Pads%' THEN 12
        WHEN p.name LIKE '%Brake Discs%' THEN 8
        WHEN p.name LIKE '%Car Battery%' THEN 8
        WHEN p.name LIKE '%Motorcycle Battery%' THEN 6
        WHEN p.name LIKE '%Coolant%' THEN 15
        WHEN p.name LIKE '%Fuel System%' THEN 20
        WHEN p.name LIKE '%Spark Plugs%' THEN 18
        WHEN p.name LIKE '%Timing Belt%' THEN 10
        ELSE 15
    END as standard_stock,
    CASE 
        WHEN p.name LIKE '%Engine Lubricant 5W-30%' THEN NULL
        WHEN p.name LIKE '%Engine Lubricant 10W-40%' THEN NULL
        WHEN p.name LIKE '%Gear Oil%' THEN NULL
        WHEN p.name LIKE '%Air Filter%' THEN 18.99
        WHEN p.name LIKE '%Oil Filter%' THEN 12.99
        WHEN p.name LIKE '%Fuel Filter%' THEN 15.99
        WHEN p.name LIKE '%Brake Pads%' THEN 89.99
        WHEN p.name LIKE '%Brake Discs%' THEN 159.99
        WHEN p.name LIKE '%Car Battery%' THEN 120.00
        WHEN p.name LIKE '%Motorcycle Battery%' THEN 85.00
        WHEN p.name LIKE '%Coolant%' THEN 24.99
        WHEN p.name LIKE '%Fuel System%' THEN 19.99
        WHEN p.name LIKE '%Spark Plugs%' THEN 45.99
        WHEN p.name LIKE '%Timing Belt%' THEN 75.99
        ELSE 25.99
    END as selling_price,
    CASE 
        WHEN p.name LIKE '%Engine Lubricant 5W-30%' THEN NULL
        WHEN p.name LIKE '%Engine Lubricant 10W-40%' THEN NULL
        WHEN p.name LIKE '%Gear Oil%' THEN NULL
        WHEN p.name LIKE '%Air Filter%' THEN 14.50
        WHEN p.name LIKE '%Oil Filter%' THEN 9.50
        WHEN p.name LIKE '%Fuel Filter%' THEN 12.00
        WHEN p.name LIKE '%Brake Pads%' THEN 65.00
        WHEN p.name LIKE '%Brake Discs%' THEN 120.00
        WHEN p.name LIKE '%Car Battery%' THEN 85.00
        WHEN p.name LIKE '%Motorcycle Battery%' THEN 60.00
        WHEN p.name LIKE '%Coolant%' THEN 18.00
        WHEN p.name LIKE '%Fuel System%' THEN 14.50
        WHEN p.name LIKE '%Spark Plugs%' THEN 32.00
        WHEN p.name LIKE '%Timing Belt%' THEN 55.00
        ELSE 18.50
    END as cost_price,
    CASE 
        WHEN p.is_oil = true AND p.name LIKE '%Engine Lubricant 5W-30%' THEN 3
        WHEN p.is_oil = true AND p.name LIKE '%Engine Lubricant 10W-40%' THEN 5
        WHEN p.is_oil = true AND p.name LIKE '%Gear Oil%' THEN 2
        ELSE 0
    END as open_bottles_stock,
    CASE 
        WHEN p.is_oil = true AND p.name LIKE '%Engine Lubricant 5W-30%' THEN 42
        WHEN p.is_oil = true AND p.name LIKE '%Engine Lubricant 10W-40%' THEN 27
        WHEN p.is_oil = true AND p.name LIKE '%Gear Oil%' THEN 18
        ELSE 0
    END as closed_bottles_stock,
    CASE 
        WHEN p.name LIKE '%Battery%' THEN true
        ELSE false
    END as is_battery
FROM product_data p
CROSS JOIN sanaiya_location s
WHERE NOT EXISTS (
    SELECT 1 FROM public.inventory i WHERE i.product_id = p.id AND i.location_id = s.id
);

-- Insert product volumes for oil products
WITH oil_products AS (
    SELECT id, name FROM public.products WHERE is_oil = true
)
INSERT INTO public.product_volumes (product_id, volume_description, selling_price, cost_price)
SELECT 
    p.id,
    v.size,
    v.selling_price,
    v.cost_price
FROM oil_products p
CROSS JOIN (
    VALUES 
        ('1L', 12.99, 9.50),
        ('4L', 34.99, 25.00),
        ('20L', 149.99, 110.00)
) AS v(size, selling_price, cost_price)
WHERE NOT EXISTS (
    SELECT 1 FROM public.product_volumes pv 
    WHERE pv.product_id = p.id AND pv.volume_description = v.size
);

-- Insert some sample batches for tracking
WITH sanaiya_location AS (
    SELECT id FROM public.locations WHERE name = 'Sanaiya' LIMIT 1
),
sample_products AS (
    SELECT id, name FROM public.products LIMIT 5
),
sample_supplier AS (
    SELECT id FROM public.suppliers LIMIT 1
)
INSERT INTO public.batches (product_id, location_id, supplier_id, purchase_date, cost_price, initial_quantity, current_quantity)
SELECT 
    p.id,
    l.id,
    s.id,
    CURRENT_DATE - INTERVAL '30 days',
    CASE 
        WHEN p.name LIKE '%Engine%' THEN 25.00
        WHEN p.name LIKE '%Filter%' THEN 10.00
        WHEN p.name LIKE '%Brake%' THEN 60.00
        ELSE 20.00
    END,
    50,
    CASE 
        WHEN p.name LIKE '%Engine%' THEN 35
        WHEN p.name LIKE '%Filter%' THEN 40
        WHEN p.name LIKE '%Brake%' THEN 25
        ELSE 30
    END
FROM sample_products p
CROSS JOIN sanaiya_location l
CROSS JOIN sample_supplier s
WHERE NOT EXISTS (
    SELECT 1 FROM public.batches b 
    WHERE b.product_id = p.id AND b.location_id = l.id
);