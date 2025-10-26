-- Script to manually apply the brand/category constraint fix directly to the database
-- Run this with: psql -d your_database -f scripts/apply-constraint-fix.sql
-- Or execute through Supabase SQL editor

BEGIN;

-- Drop existing foreign key constraints
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_brand_id_fkey CASCADE;

ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_category_id_fkey CASCADE;

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

-- Verify the changes
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    confdeltype AS on_delete_action,
    confupdtype AS on_update_action
FROM pg_constraint
WHERE conname IN ('products_brand_id_fkey', 'products_category_id_fkey');

COMMIT;

-- Print success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Brand and category foreign key constraints have been updated successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'ON DELETE SET NULL has been applied to:';
  RAISE NOTICE '  - products.brand_id → brands.id';
  RAISE NOTICE '  - products.category_id → categories.id';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now delete brands and categories without errors.';
  RAISE NOTICE 'Products using deleted brands/categories will have their references set to NULL.';
  RAISE NOTICE '';
END $$;

