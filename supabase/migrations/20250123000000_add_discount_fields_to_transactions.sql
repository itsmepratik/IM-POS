-- Migration: Add discount fields to transactions table
-- This allows tracking discounts applied during checkout

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS discount_type TEXT,
ADD COLUMN IF NOT EXISTS discount_value NUMERIC,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC,
ADD COLUMN IF NOT EXISTS subtotal_before_discount NUMERIC;

-- Add comments for documentation
COMMENT ON COLUMN public.transactions.discount_type IS 'Type of discount applied: "percentage" or "amount"';
COMMENT ON COLUMN public.transactions.discount_value IS 'The discount percentage (0-100) or fixed amount in OMR';
COMMENT ON COLUMN public.transactions.discount_amount IS 'Calculated discount amount in OMR after applying discount';
COMMENT ON COLUMN public.transactions.subtotal_before_discount IS 'Original subtotal before discount was applied';

