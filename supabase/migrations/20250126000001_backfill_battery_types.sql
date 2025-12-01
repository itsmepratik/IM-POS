-- Migration: Backfill battery tracking fields based on type_id
-- Date: 2025-01-26
-- Purpose: Fix backfill for products that use type_id instead of product_type text

-- Update products that have a type_id pointing to a "Battery" type
UPDATE products 
SET is_battery = TRUE, 
    battery_state = 'new'
WHERE type_id IN (
  SELECT id FROM types 
  WHERE name ILIKE '%battery%' OR name ILIKE '%batteries%'
)
AND is_battery IS NOT TRUE;
