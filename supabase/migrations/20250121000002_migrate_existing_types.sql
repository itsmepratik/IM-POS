-- Migrate existing hardcoded types to database
-- This migration inserts default types for each category

-- Insert types for Lubricants category
INSERT INTO public.types (category_id, name)
SELECT id, 'Synthetic'
FROM public.categories
WHERE name = 'Lubricants'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Non-synthetic'
FROM public.categories
WHERE name = 'Lubricants'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert types for Filters category
INSERT INTO public.types (category_id, name)
SELECT id, 'Oil filters'
FROM public.categories
WHERE name = 'Filters'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Air filters'
FROM public.categories
WHERE name = 'Filters'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Cabin filters'
FROM public.categories
WHERE name = 'Filters'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert types for Parts category
INSERT INTO public.types (category_id, name)
SELECT id, 'Miscellaneous'
FROM public.categories
WHERE name = 'Parts'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Battery'
FROM public.categories
WHERE name = 'Parts'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Spare parts'
FROM public.categories
WHERE name = 'Parts'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert types for Additives & Fluids category
INSERT INTO public.types (category_id, name)
SELECT id, 'Engine additives'
FROM public.categories
WHERE name = 'Additives & Fluids'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Transmission fluid'
FROM public.categories
WHERE name = 'Additives & Fluids'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Brake fluid'
FROM public.categories
WHERE name = 'Additives & Fluids'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Coolant'
FROM public.categories
WHERE name = 'Additives & Fluids'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Power steering fluid'
FROM public.categories
WHERE name = 'Additives & Fluids'
ON CONFLICT (category_id, name) DO NOTHING;

