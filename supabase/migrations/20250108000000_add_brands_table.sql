-- Add brands table migration
-- This migration creates the brands table and updates the products table

-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add brand_id column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brands_name ON public.brands(name);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);

-- Add comments for documentation
COMMENT ON TABLE public.brands IS 'Brand information for products';
COMMENT ON COLUMN public.products.brand_id IS 'Reference to brands table, nullable for backward compatibility';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brands_updated_at 
    BEFORE UPDATE ON public.brands 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
