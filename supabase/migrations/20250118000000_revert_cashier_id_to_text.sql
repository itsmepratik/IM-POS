-- Revert cashier_id from UUID back to TEXT
-- This allows the application to use staff IDs like "0010" instead of UUIDs
-- Migration created: 2025-01-18

-- Drop the foreign key constraint first
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_cashier_id_staff_id_fk";

-- Change the column type back to text
-- Note: This will fail if there are existing UUID values that can't be cast to text
-- We'll handle this by first converting any UUID values to their string representation
ALTER TABLE "transactions" ALTER COLUMN "cashier_id" TYPE text USING "cashier_id"::text;

-- Update any existing NULL values to a default value
UPDATE "transactions" SET "cashier_id" = 'system' WHERE "cashier_id" IS NULL OR "cashier_id" = '';

-- Add a comment to document the change
COMMENT ON COLUMN "transactions"."cashier_id" IS 'Staff ID as text (e.g., "0010", "0020"). Changed from UUID to text to support legacy staff ID format.';

