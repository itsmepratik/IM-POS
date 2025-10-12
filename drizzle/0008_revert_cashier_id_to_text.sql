-- Revert cashier_id from UUID back to TEXT
-- This allows the application to use staff IDs like "0010" instead of UUIDs

-- Drop the foreign key constraint first
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_cashier_id_staff_id_fk";

-- Change the column type back to text
ALTER TABLE "transactions" ALTER COLUMN "cashier_id" SET DATA TYPE text;

-- Update any existing NULL values or invalid UUIDs to a default value
UPDATE "transactions" SET "cashier_id" = 'system' WHERE "cashier_id" IS NULL;

