-- Migration: Add notes field to transactions table
-- This allows storing additional information about transactions (e.g., stock transfer details)

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.notes IS 'Additional notes or information about the transaction (e.g., "Stock transfer between Sanaiya to Abu Dhurus")';

-- Add index for performance (if we need to search notes)
CREATE INDEX IF NOT EXISTS idx_transactions_notes ON public.transactions(notes);

