-- Fix brand and category foreign key constraints to allow proper deletion
-- This migration updates the foreign key constraints to properly handle deletions

-- Drop existing foreign key constraints
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_brand_id_fkey;

ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- Recreate brand_id foreign key with proper ON DELETE SET NULL
ALTER TABLE public.products
ADD CONSTRAINT products_brand_id_fkey 
FOREIGN KEY (brand_id) 
REFERENCES public.brands(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Recreate category_id foreign key with proper ON DELETE SET NULL
ALTER TABLE public.products
ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES public.categories(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Add comments
COMMENT ON CONSTRAINT products_brand_id_fkey ON public.products IS 'Foreign key to brands table with ON DELETE SET NULL to allow brand deletion';
COMMENT ON CONSTRAINT products_category_id_fkey ON public.products IS 'Foreign key to categories table with ON DELETE SET NULL to allow category deletion';

-- Verify the constraints
DO $$
BEGIN
  RAISE NOTICE 'Brand and category foreign key constraints have been updated to allow proper deletion';
END $$;

