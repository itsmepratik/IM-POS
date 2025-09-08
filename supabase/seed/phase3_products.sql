-- Phase 3 seed: 4 categories, 2 products each, plus inventory and volumes
-- Idempotent inserts using WHERE NOT EXISTS patterns

-- 1) Categories
WITH ins AS (
  INSERT INTO public.categories (name)
  SELECT unnest(ARRAY['Lubricants','Filters','Parts','Additives & Fluids'])
  ON CONFLICT (name) DO NOTHING
  RETURNING id, name
)
SELECT 1;

-- 2) Default location (branch)
WITH ins AS (
  INSERT INTO public.locations (name)
  SELECT 'Main Branch'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.locations WHERE name = 'Main Branch'
  )
  RETURNING id
)
SELECT 1;

-- 3) Grab ids for later use
WITH c AS (
  SELECT id, name FROM public.categories
),
loc AS (
  SELECT id FROM public.locations WHERE name = 'Main Branch' LIMIT 1
),
targets AS (
  SELECT
    (SELECT id FROM c WHERE name = 'Lubricants') AS lubricants_id,
    (SELECT id FROM c WHERE name = 'Filters') AS filters_id,
    (SELECT id FROM c WHERE name = 'Parts') AS parts_id,
    (SELECT id FROM c WHERE name = 'Additives & Fluids') AS additives_id,
    (SELECT id FROM loc) AS location_id
)
SELECT 1;

-- 4) Insert products (2 per category) if missing by name

-- Lubricants
WITH cat AS (
  SELECT id AS category_id FROM public.categories WHERE name = 'Lubricants' LIMIT 1
)
INSERT INTO public.products (name, category_id, brand, product_type, description, image_url, low_stock_threshold)
SELECT x.name, (SELECT category_id FROM cat), x.brand, x.type, x.desc, NULL, 0
FROM (
  VALUES
    ('Motor Oil 5W-30', 'ACME', 'Oil', 'Synthetic 5W-30 motor oil'),
    ('Gear Oil 75W-90', 'GearMax', 'Oil', 'High performance gear oil')
) AS x(name, brand, type, desc)
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = x.name);

-- Filters
WITH cat AS (
  SELECT id AS category_id FROM public.categories WHERE name = 'Filters' LIMIT 1
)
INSERT INTO public.products (name, category_id, brand, product_type, description, image_url, low_stock_threshold)
SELECT x.name, (SELECT category_id FROM cat), x.brand, x.type, x.desc, NULL, 0
FROM (
  VALUES
    ('Oil Filter A1', 'FilterCo', 'Oil Filter', 'Standard oil filter'),
    ('Air Filter B2', 'FilterCo', 'Air Filter', 'High flow air filter')
) AS x(name, brand, type, desc)
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = x.name);

-- Parts
WITH cat AS (
  SELECT id AS category_id FROM public.categories WHERE name = 'Parts' LIMIT 1
)
INSERT INTO public.products (name, category_id, brand, product_type, description, image_url, low_stock_threshold)
SELECT x.name, (SELECT category_id FROM cat), x.brand, x.type, x.desc, NULL, 0
FROM (
  VALUES
    ('Brake Pad Set', 'AutoPartsX', 'Brake', 'Ceramic brake pad set'),
    ('Spark Plug C7', 'Ignite', 'Ignition', 'Copper core spark plug')
) AS x(name, brand, type, desc)
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = x.name);

-- Additives & Fluids
WITH cat AS (
  SELECT id AS category_id FROM public.categories WHERE name = 'Additives & Fluids' LIMIT 1
)
INSERT INTO public.products (name, category_id, brand, product_type, description, image_url, low_stock_threshold)
SELECT x.name, (SELECT category_id FROM cat), x.brand, x.type, x.desc, NULL, 0
FROM (
  VALUES
    ('Coolant Green', 'ChemTech', 'Coolant', 'Ethylene glycol coolant'),
    ('Fuel System Cleaner', 'ChemTech', 'Additive', 'Fuel injector cleaner')
) AS x(name, brand, type, desc)
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = x.name);

-- 5) Inventory for each product at Main Branch
WITH lb AS (
  SELECT id FROM public.locations WHERE name = 'Main Branch' LIMIT 1
)
INSERT INTO public.inventory (product_id, location_id, standard_stock, selling_price, open_bottles_stock, closed_bottles_stock)
SELECT p.id, (SELECT id FROM lb),
  CASE WHEN c.name = 'Lubricants' THEN 0 ELSE 25 END AS standard_stock,
  CASE WHEN c.name = 'Lubricants' THEN NULL ELSE 19.99 END AS selling_price,
  CASE WHEN c.name = 'Lubricants' THEN 3 ELSE 0 END AS open_bottles_stock,
  CASE WHEN c.name = 'Lubricants' THEN 10 ELSE 0 END AS closed_bottles_stock
FROM public.products p
JOIN public.categories c ON c.id = p.category_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory i WHERE i.product_id = p.id AND i.location_id = (SELECT id FROM lb)
);

-- 6) Volumes for Lubricants
INSERT INTO public.product_volumes (product_id, volume_description, selling_price)
SELECT p.id, v.size, v.price
FROM public.products p
JOIN public.categories c ON c.id = p.category_id AND c.name = 'Lubricants'
JOIN LATERAL (
  VALUES ('1L', 9.99::numeric), ('4L', 34.99::numeric), ('20L', 149.99::numeric)
) AS v(size, price) ON TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_volumes pv WHERE pv.product_id = p.id AND pv.volume_description = v.size
);


