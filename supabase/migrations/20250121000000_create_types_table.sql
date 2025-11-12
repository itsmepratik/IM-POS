-- Create types table migration
-- This migration creates the types table linked to categories

-- Create types table
CREATE TABLE IF NOT EXISTS public.types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT types_category_name_unique UNIQUE(category_id, name)
);

-- Create index on category_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_types_category_id ON public.types(category_id);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_types_name ON public.types(name);

-- Add comment to table
COMMENT ON TABLE public.types IS 'Product types linked to categories. Each category can have multiple types.';

