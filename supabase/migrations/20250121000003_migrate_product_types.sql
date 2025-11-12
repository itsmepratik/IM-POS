-- Migrate existing product_type text values to type_id references
-- This migration matches product_type values to types.name and sets type_id

-- Update products with matching type names (case-insensitive)
UPDATE public.products p
SET type_id = t.id
FROM public.types t
WHERE p.category_id = t.category_id
  AND LOWER(TRIM(p.product_type)) = LOWER(TRIM(t.name))
  AND p.type_id IS NULL
  AND p.product_type IS NOT NULL;

-- Log products that couldn't be matched (for manual review)
-- This creates a temporary table to help identify unmatched products
DO $$
DECLARE
    unmatched_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmatched_count
    FROM public.products
    WHERE product_type IS NOT NULL
      AND type_id IS NULL;
    
    IF unmatched_count > 0 THEN
        RAISE NOTICE 'Found % products with product_type that could not be matched to types table', unmatched_count;
        RAISE NOTICE 'These products need manual review:';
        RAISE NOTICE 'Product IDs and types:';
        
        -- Log unmatched products
        PERFORM * FROM (
            SELECT p.id, p.name, p.product_type, c.name as category_name
            FROM public.products p
            JOIN public.categories c ON p.category_id = c.id
            WHERE p.product_type IS NOT NULL
              AND p.type_id IS NULL
        ) AS unmatched;
    ELSE
        RAISE NOTICE 'All products with product_type have been successfully matched to types';
    END IF;
END $$;

