-- Ensure the FK constraint between transactions.cashier_id and staff.id exists
-- This was dropped during a migration but never re-created properly

-- First, drop the column if it exists with wrong type and re-add
DO $$
BEGIN
  -- Check if the FK constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transactions_cashier_id_staff_id_fk'
    AND conrelid = 'public.transactions'::regclass
  ) THEN
    -- Verify cashier_id is UUID type
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name = 'cashier_id'
      AND udt_name = 'uuid'
    ) THEN
      -- Add the FK constraint
      ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_cashier_id_staff_id_fk 
      FOREIGN KEY (cashier_id) 
      REFERENCES public.staff(id) 
      ON DELETE SET NULL 
      ON UPDATE CASCADE;
      
      RAISE NOTICE 'Created FK constraint transactions_cashier_id_staff_id_fk';
    ELSE
      RAISE WARNING 'cashier_id column is not UUID type - skipping FK creation';
    END IF;
  ELSE
    RAISE NOTICE 'FK constraint transactions_cashier_id_staff_id_fk already exists';
  END IF;
END $$;
