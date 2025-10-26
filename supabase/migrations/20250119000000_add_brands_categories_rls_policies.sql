-- Add RLS policies for brands and categories tables
-- This migration ensures that authenticated users can manage brands and categories

-- Enable RLS on brands table
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for brands table
CREATE POLICY "Authenticated users can view brands" ON public.brands
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert brands" ON public.brands
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update brands" ON public.brands
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete brands" ON public.brands
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create policies for categories table
CREATE POLICY "Authenticated users can view categories" ON public.categories
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert categories" ON public.categories
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update categories" ON public.categories
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete categories" ON public.categories
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON POLICY "Authenticated users can view brands" ON public.brands IS 'Allow authenticated users to view brands';
COMMENT ON POLICY "Authenticated users can insert brands" ON public.brands IS 'Allow authenticated users to create brands';
COMMENT ON POLICY "Authenticated users can update brands" ON public.brands IS 'Allow authenticated users to update brands';
COMMENT ON POLICY "Authenticated users can delete brands" ON public.brands IS 'Allow authenticated users to delete brands';

COMMENT ON POLICY "Authenticated users can view categories" ON public.categories IS 'Allow authenticated users to view categories';
COMMENT ON POLICY "Authenticated users can insert categories" ON public.categories IS 'Allow authenticated users to create categories';
COMMENT ON POLICY "Authenticated users can update categories" ON public.categories IS 'Allow authenticated users to update categories';
COMMENT ON POLICY "Authenticated users can delete categories" ON public.categories IS 'Allow authenticated users to delete categories';
