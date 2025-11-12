-- Add type_id column to products table
-- This migration adds type_id foreign key while keeping product_type for backward compatibility

-- Add type_id column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS type_id UUID REFERENCES public.types(id) ON DELETE SET NULL;

-- Create index on type_id for performance
CREATE INDEX IF NOT EXISTS idx_products_type_id ON public.products(type_id);

-- Add comment to column
COMMENT ON COLUMN public.products.type_id IS 'Foreign key to types table. Replaces product_type text field.';

