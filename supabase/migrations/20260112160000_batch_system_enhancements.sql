-- Migration: Batch System Enhancements
-- Description: Add batch_number column, auto-numbering, cleanup function, and create initial batches for existing inventory

-- 1. Add batch_number column for ordering (Batch 1, Batch 2, etc.)
ALTER TABLE batches ADD COLUMN IF NOT EXISTS batch_number INTEGER DEFAULT 1;

-- 2. Create function to auto-generate batch_number
CREATE OR REPLACE FUNCTION set_batch_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(batch_number), 0) + 1 INTO NEW.batch_number
  FROM batches WHERE inventory_id = NEW.inventory_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger for auto batch numbering
DROP TRIGGER IF EXISTS tr_set_batch_number ON batches;
CREATE TRIGGER tr_set_batch_number
BEFORE INSERT ON batches
FOR EACH ROW EXECUTE FUNCTION set_batch_number();

-- 4. Function to cleanup old batches (keep last N)
CREATE OR REPLACE FUNCTION cleanup_old_batches(p_keep_count INTEGER DEFAULT 5)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
BEGIN
  WITH ranked_batches AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY inventory_id ORDER BY batch_number DESC) as rn
    FROM batches
    WHERE stock_remaining = 0 -- Only delete exhausted batches
  )
  DELETE FROM batches 
  WHERE id IN (SELECT id FROM ranked_batches WHERE rn > p_keep_count);
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Create initial "Batch 1" for all existing inventory items without batches
-- This populates the batches table for existing inventory with their current stock levels
INSERT INTO batches (inventory_id, cost_price, quantity_received, stock_remaining, is_active_batch, purchase_date, batch_number)
SELECT 
  i.id,
  COALESCE(p.cost_price, 0)::numeric,
  COALESCE(i.standard_stock, 0) + COALESCE(i.closed_bottles_stock, 0),
  COALESCE(i.standard_stock, 0) + COALESCE(i.closed_bottles_stock, 0),
  TRUE,
  NOW(),
  1
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM batches b WHERE b.inventory_id = i.id
)
AND (COALESCE(i.standard_stock, 0) + COALESCE(i.closed_bottles_stock, 0)) > 0;

-- 6. Set batch_number for any existing batches that don't have one
WITH numbered AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY inventory_id ORDER BY purchase_date ASC, created_at ASC) as new_batch_num
  FROM batches
  WHERE batch_number IS NULL OR batch_number = 1
)
UPDATE batches b
SET batch_number = n.new_batch_num
FROM numbered n
WHERE b.id = n.id;

-- 7. Add index for batch_number queries
CREATE INDEX IF NOT EXISTS idx_batches_inventory_batch_number 
ON batches(inventory_id, batch_number);
