-- Migration: Add battery tracking fields to products table
-- Date: 2025-01-26
-- Purpose: Enable proper battery inventory categorization for new batteries and trade-ins

-- Add is_battery column (boolean, defaults to false)
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_battery BOOLEAN DEFAULT FALSE;

-- Add battery_state column (text, nullable, one of: 'new', 'scrap', 'resellable')
ALTER TABLE products ADD COLUMN IF NOT EXISTS battery_state TEXT CHECK (battery_state IN ('new', 'scrap', 'resellable'));

-- Create index for better query performance when filtering batteries
CREATE INDEX IF NOT EXISTS idx_products_is_battery_battery_state 
  ON products(is_battery, battery_state) WHERE is_battery = TRUE;

-- Backfill existing battery products (from Parts category with Battery type)
-- This will mark existing batteries as "new" state
UPDATE products 
SET is_battery = TRUE, 
    battery_state = 'new'
WHERE category_id IN (SELECT id FROM categories WHERE name = 'Parts')
  AND (product_type ILIKE '%battery%' OR product_type ILIKE '%batteries%')
  AND is_battery IS NOT TRUE;

-- Comment for documentation
COMMENT ON COLUMN products.is_battery IS 'Indicates if this product is a battery';
COMMENT ON COLUMN products.battery_state IS 'Battery state: new (manually added), scrap (trade-in not resellable), or resellable (trade-in resellable)';
