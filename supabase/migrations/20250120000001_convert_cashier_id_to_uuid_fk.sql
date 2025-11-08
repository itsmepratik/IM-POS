-- Migration: Convert cashier_id from text to UUID foreign key to staff table
-- This migrates existing cashier_id values (like "0010") to UUID references

-- Step 1: Add a temporary UUID column
ALTER TABLE public.transactions 
ADD COLUMN cashier_id_uuid UUID;

-- Step 2: Update existing cashier_id values to UUIDs by joining with staff table
-- Match on staff.staff_id (text) = transactions.cashier_id (text) to get staff.id (UUID)
UPDATE public.transactions t
SET cashier_id_uuid = s.id
FROM public.staff s
WHERE t.cashier_id = s.staff_id
  AND t.cashier_id IS NOT NULL
  AND t.cashier_id != 'SYSTEM'
  AND t.cashier_id != 'default-cashier'
  AND t.cashier_id != 'on-hold-system';

-- Step 3: Handle special cases (SYSTEM, default-cashier, on-hold-system)
-- These can remain NULL or we can create a system staff member
-- For now, leave them as NULL

-- Step 4: Drop the old text column
ALTER TABLE public.transactions 
DROP COLUMN cashier_id;

-- Step 5: Rename the UUID column to cashier_id
ALTER TABLE public.transactions 
RENAME COLUMN cashier_id_uuid TO cashier_id;

-- Step 6: Add foreign key constraint
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_cashier_id_staff_id_fk 
FOREIGN KEY (cashier_id) 
REFERENCES public.staff(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Step 7: Add comment
COMMENT ON COLUMN public.transactions.cashier_id IS 'Foreign key to staff.id (UUID). References the staff member who processed the transaction.';

