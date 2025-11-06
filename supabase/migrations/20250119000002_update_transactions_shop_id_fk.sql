-- Migration: Update transactions.shop_id to reference shops table instead of locations
-- Step 1: Drop old foreign key constraint
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_shop_id_locations_id_fk;

-- Step 2: Ensure all required shops exist
INSERT INTO public.shops (id, name, location_id, display_name, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Sanaiya', 'c4212c14-64f3-4c9e-aa0e-6317fa3e9c3c', 'Sanaiya', true)
ON CONFLICT DO NOTHING;

-- Step 3: Update transactions.shop_id to point to shops instead of locations
UPDATE public.transactions
SET shop_id = CASE
  WHEN shop_id = '9c284f57-22db-40ce-9703-c5290d8769be' THEN '9d188fe2-201f-434a-bac3-8ee86240202e' -- Saniya1 location -> Saniya1 shop
  WHEN shop_id = '5b0ee3e7-8a72-4747-8547-cf27f26974ee' THEN '937689e9-6bb7-4942-a007-d744624f1a4f' -- Saniya2 location -> Saniya2 shop
  WHEN shop_id = '93922a5e-5327-4561-8395-97a4653c720c' THEN '165cb8b9-0742-4eee-9d1d-1ab400a11a8b' -- Hafith location -> Hafith shop
  WHEN shop_id = 'c4212c14-64f3-4c9e-aa0e-6317fa3e9c3c' THEN '00000000-0000-0000-0000-000000000001' -- Sanaiya location -> Sanaiya shop
  ELSE shop_id
END
WHERE shop_id IN (
  '9c284f57-22db-40ce-9703-c5290d8769be',
  '5b0ee3e7-8a72-4747-8547-cf27f26974ee',
  '93922a5e-5327-4561-8395-97a4653c720c',
  'c4212c14-64f3-4c9e-aa0e-6317fa3e9c3c'
);

-- Step 4: Add new foreign key constraint referencing shops table
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_shop_id_shops_id_fk 
FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE RESTRICT;

