-- =========================================================
-- Auto-generated safe-to-run SQL file
-- Generated: 2026-07-24T05:14:33.570Z
-- Source files: 47
-- Total statements: 238
-- Skipped (uninteresting): 12
-- Skipped (unsafe): 2
-- =========================================================

-- Functions: 44
-- Indexes: 42
-- Comments: 34
-- Schema_Changes: 22
-- RLS_Policies: 18
-- Seed_Data: 18
-- Tables: 17
-- Triggers: 16
-- Updates: 16
-- RLS_Enable: 6
-- Drops: 3
-- Views: 2

SET client_min_messages TO warning;

BEGIN;

-- Create user_role enum
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'shop');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create permission enum
DO $$ BEGIN
    CREATE TYPE public.permission AS ENUM (
        'pos.access',
        'inventory.access',
        'customers.access',
        'transactions.access',
        'notifications.access',
        'reports.access',
        'settings.access',
        'users.access',
        'admin.access'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role DEFAULT 'shop',
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role user_role NOT NULL,
    permission permission NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role, permission)
);

-- Create user_info view
CREATE OR REPLACE VIEW public.user_info AS
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM public.user_profiles;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission);

-- Add brands table migration
-- This migration creates the brands table and updates the products table

-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add brand_id column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brands_name ON public.brands(name);

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);

-- Add comments for documentation
COMMENT ON TABLE public.brands IS 'Brand information for products';

COMMENT ON COLUMN public.products.brand_id IS 'Reference to brands table, nullable for backward compatibility';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brands_updated_at 
    BEFORE UPDATE ON public.brands 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add open_bottle_details table for detailed lubricant tracking
-- This table tracks every single bottle that has been opened, allowing for precise volume deduction

CREATE TABLE IF NOT EXISTS public.open_bottle_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    initial_volume NUMERIC NOT NULL,
    current_volume NUMERIC NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_empty BOOLEAN DEFAULT false NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_open_bottle_details_inventory_id ON public.open_bottle_details(inventory_id);

CREATE INDEX IF NOT EXISTS idx_open_bottle_details_is_empty ON public.open_bottle_details(is_empty);

CREATE INDEX IF NOT EXISTS idx_open_bottle_details_opened_at ON public.open_bottle_details(opened_at);

-- Add comments for documentation
COMMENT ON TABLE public.open_bottle_details IS 'Tracks individual open lubricant bottles and their remaining volume';

COMMENT ON COLUMN public.open_bottle_details.inventory_id IS 'Foreign key referencing the inventory table - links to specific product at specific location';

COMMENT ON COLUMN public.open_bottle_details.initial_volume IS 'The original size of the bottle when it was new (e.g., 4.0 for a 4-liter bottle)';

COMMENT ON COLUMN public.open_bottle_details.current_volume IS 'The amount of liquid currently remaining in this specific bottle';

COMMENT ON COLUMN public.open_bottle_details.opened_at IS 'Timestamp when this bottle was first opened';

COMMENT ON COLUMN public.open_bottle_details.is_empty IS 'Set to true when current_volume reaches zero';

-- Enable Row Level Security (RLS)
ALTER TABLE public.open_bottle_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for authenticated users to read open bottle details
CREATE POLICY "Users can view open bottle details" ON public.open_bottle_details
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert open bottle details
CREATE POLICY "Users can create open bottle details" ON public.open_bottle_details
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update open bottle details
CREATE POLICY "Users can update open bottle details" ON public.open_bottle_details
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete open bottle details
CREATE POLICY "Users can delete open bottle details" ON public.open_bottle_details
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  last_visit TIMESTAMP WITH TIME ZONE,
  address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_vehicles table
CREATE TABLE IF NOT EXISTS customer_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  plate_number TEXT NOT NULL,
  color TEXT,
  engine_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

CREATE INDEX IF NOT EXISTS idx_customer_vehicles_customer_id ON customer_vehicles(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_vehicles_plate_number ON customer_vehicles(plate_number);

CREATE INDEX IF NOT EXISTS idx_customer_vehicles_make_model ON customer_vehicles(make, model);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_vehicles_updated_at 
  BEFORE UPDATE ON customer_vehicles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

ALTER TABLE customer_vehicles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON customer_vehicles
  FOR ALL USING (auth.role() = 'authenticated');

-- Create locations table (branches)
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    product_type TEXT,
    description TEXT,
    image_url TEXT,
    is_oil BOOLEAN DEFAULT false,
    low_stock_threshold INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create inventory table (stock levels per location)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    standard_stock INTEGER DEFAULT 0,
    selling_price NUMERIC(10,2),
    cost_price NUMERIC(10,2),
    open_bottles_stock INTEGER DEFAULT 0,
    closed_bottles_stock INTEGER DEFAULT 0,
    is_battery BOOLEAN DEFAULT false,
    battery_state TEXT CHECK (battery_state IN ('new', 'scrap', 'resellable')),
    manufacturing_date DATE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, location_id)
);

-- Create product_volumes table (for oil products with different sizes)
CREATE TABLE IF NOT EXISTS public.product_volumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    volume_description TEXT NOT NULL,
    selling_price NUMERIC(10,2) NOT NULL,
    cost_price NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, volume_description)
);

-- Create batches table (for tracking product batches)
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    purchase_date DATE,
    expiration_date DATE,
    cost_price NUMERIC(10,2),
    initial_quantity INTEGER NOT NULL,
    current_quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);

CREATE INDEX IF NOT EXISTS idx_products_is_oil ON public.products(is_oil);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON public.inventory(location_id);

CREATE INDEX IF NOT EXISTS idx_inventory_product_location ON public.inventory(product_id, location_id);

CREATE INDEX IF NOT EXISTS idx_product_volumes_product_id ON public.product_volumes(product_id);

CREATE INDEX IF NOT EXISTS idx_batches_product_id ON public.batches(product_id);

CREATE INDEX IF NOT EXISTS idx_batches_location_id ON public.batches(location_id);

CREATE INDEX IF NOT EXISTS idx_batches_supplier_id ON public.batches(supplier_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_volumes_updated_at BEFORE UPDATE ON public.product_volumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.locations IS 'Store locations/branches';

COMMENT ON TABLE public.categories IS 'Product categories';

COMMENT ON TABLE public.suppliers IS 'Product suppliers';

COMMENT ON TABLE public.products IS 'Product catalog';

COMMENT ON TABLE public.inventory IS 'Stock levels per product per location';

COMMENT ON TABLE public.product_volumes IS 'Different volume options for oil products';

COMMENT ON TABLE public.batches IS 'Product batch tracking for inventory management';

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

-- Migration: Add shop location assignment fields to user_profiles
-- This migration adds fields to link shop users to their assigned locations
-- and to specify which location to use for inventory queries

-- Drop the user_info view first to avoid conflicts
DROP VIEW IF EXISTS public.user_info;

-- Add shop_location_id column (for UI display/locking)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS shop_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Add inventory_location_id column (for inventory queries)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS inventory_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Add shop_display_name column (for shop-specific display names)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS shop_display_name TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_shop_location_id ON public.user_profiles(shop_location_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_inventory_location_id ON public.user_profiles(inventory_location_id);

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.shop_location_id IS 'Location ID assigned to shop user for UI display and branch locking';

COMMENT ON COLUMN public.user_profiles.inventory_location_id IS 'Location ID to use for inventory queries (may differ from shop_location_id for shared inventory)';

COMMENT ON COLUMN public.user_profiles.shop_display_name IS 'Shop-specific display name to show in UI (e.g., "Saniya1", "Saniya2")';

-- Recreate user_info view to include new fields
CREATE OR REPLACE VIEW public.user_info AS
SELECT 
    id,
    email,
    full_name,
    role,
    shop_location_id,
    inventory_location_id,
    shop_display_name,
    created_at,
    updated_at
FROM public.user_profiles;

-- Migration: Update transactions.shop_id to reference shops table instead of locations
-- Step 1: Drop old foreign key constraint
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_shop_id_locations_id_fk;

-- Step 2: Ensure all required shops exist
INSERT INTO public.shops (id, name, location_id, display_name, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Sanaiya', 'c4212c14-64f3-4c9e-aa0e-6317fa3e9c3c', 'Sanaiya', true)
ON CONFLICT DO NOTHING;

-- Step 3: Update transactions.shop_id to point to shops instead of locations
UPDATE public.transactions
SET shop_id = CASE
  WHEN shop_id = '9c284f57-22db-40ce-9703-c5290d8769be' THEN '9d188fe2-201f-434a-bac3-8ee86240202e' -- Saniya1 location -> Saniya1 shop
  WHEN shop_id = '5b0ee3e7-8a72-4747-8547-cf27f26974ee' THEN '937689e9-6bb7-4942-a007-d744624f1a4f' -- Saniya2 location -> Saniya2 shop
  WHEN shop_id = '93922a5e-5327-4561-8395-97a4653c720c' THEN '165cb8b9-0742-4eee-9d1d-1ab400a11a8b' -- Hafith location -> Hafith shop
  WHEN shop_id = 'c4212c14-64f3-4c9e-aa0e-6317fa3e9c3c' THEN '00000000-0000-0000-0000-000000000001' -- Sanaiya location -> Sanaiya shop
  ELSE shop_id
END
WHERE shop_id IN (
  '9c284f57-22db-40ce-9703-c5290d8769be',
  '5b0ee3e7-8a72-4747-8547-cf27f26974ee',
  '93922a5e-5327-4561-8395-97a4653c720c',
  'c4212c14-64f3-4c9e-aa0e-6317fa3e9c3c'
);

-- Step 4: Add new foreign key constraint referencing shops table
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_shop_id_shops_id_fk 
FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE RESTRICT;

-- Migration: Migrate hardcoded staff data from frontend to database
-- This inserts/updates all 9 staff members from lib/hooks/useStaffIDs.ts

-- Insert or update staff members
-- If staff_id exists, update the name; otherwise insert new record
INSERT INTO public.staff (staff_id, name, is_active, created_at, updated_at)
VALUES 
  ('0010', 'Abul Hossain (foreman)', true, now(), now()),
  ('0020', 'Adnan', true, now(), now()),
  ('0030', 'Ashiq', true, now(), now()),
  ('0041', 'Badsha', true, now(), now()),
  ('0051', 'Abid', true, now(), now()),
  ('0062', 'Bellal', true, now(), now()),
  ('0073', 'Sakib', true, now(), now()),
  ('0084', 'Obaydul', true, now(), now()),
  ('0094', 'Nur Alom', true, now(), now())
ON CONFLICT (staff_id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  is_active = true,
  updated_at = now();

-- Verify all staff members were inserted/updated
-- This will fail if any staff_id is missing
DO $$
DECLARE
  expected_count INTEGER := 9;
  actual_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO actual_count 
  FROM public.staff 
  WHERE staff_id IN ('0010', '0020', '0030', '0041', '0051', '0062', '0073', '0084', '0094');
  
  IF actual_count < expected_count THEN
    RAISE EXCEPTION 'Expected % staff members, but found %', expected_count, actual_count;
  END IF;
END $$;

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

-- Step 6: Add foreign key constraint
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_cashier_id_staff_id_fk 
FOREIGN KEY (cashier_id) 
REFERENCES public.staff(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Step 7: Add comment
COMMENT ON COLUMN public.transactions.cashier_id IS 'Foreign key to staff.id (UUID). References the staff member who processed the transaction.';

-- Create types table migration
-- This migration creates the types table linked to categories

-- Create types table
CREATE TABLE IF NOT EXISTS public.types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT types_category_name_unique UNIQUE(category_id, name)
);

-- Create index on category_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_types_category_id ON public.types(category_id);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_types_name ON public.types(name);

-- Add comment to table
COMMENT ON TABLE public.types IS 'Product types linked to categories. Each category can have multiple types.';

-- Add type_id column to products table
-- This migration adds type_id foreign key while keeping product_type for backward compatibility

-- Add type_id column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS type_id UUID REFERENCES public.types(id) ON DELETE SET NULL;

-- Create index on type_id for performance
CREATE INDEX IF NOT EXISTS idx_products_type_id ON public.products(type_id);

-- Add comment to column
COMMENT ON COLUMN public.products.type_id IS 'Foreign key to types table. Replaces product_type text field.';

-- Migrate existing hardcoded types to database
-- This migration inserts default types for each category

-- Insert types for Lubricants category
INSERT INTO public.types (category_id, name)
SELECT id, 'Synthetic'
FROM public.categories
WHERE name = 'Lubricants'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Non-synthetic'
FROM public.categories
WHERE name = 'Lubricants'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert types for Filters category
INSERT INTO public.types (category_id, name)
SELECT id, 'Oil filters'
FROM public.categories
WHERE name = 'Filters'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Air filters'
FROM public.categories
WHERE name = 'Filters'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Cabin filters'
FROM public.categories
WHERE name = 'Filters'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert types for Parts category
INSERT INTO public.types (category_id, name)
SELECT id, 'Miscellaneous'
FROM public.categories
WHERE name = 'Parts'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Battery'
FROM public.categories
WHERE name = 'Parts'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Spare parts'
FROM public.categories
WHERE name = 'Parts'
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert types for Additives & Fluids category
INSERT INTO public.types (category_id, name)
SELECT id, 'Engine additives'
FROM public.categories
WHERE name = 'Additives & Fluids'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Transmission fluid'
FROM public.categories
WHERE name = 'Additives & Fluids'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Brake fluid'
FROM public.categories
WHERE name = 'Additives & Fluids'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Coolant'
FROM public.categories
WHERE name = 'Additives & Fluids'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.types (category_id, name)
SELECT id, 'Power steering fluid'
FROM public.categories
WHERE name = 'Additives & Fluids'
ON CONFLICT (category_id, name) DO NOTHING;

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

-- Migration: Add notes field to transactions table
-- This allows storing additional information about transactions (e.g., stock transfer details)

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.notes IS 'Additional notes or information about the transaction (e.g., "Stock transfer between Sanaiya to Abu Dhurus")';

-- Add index for performance (if we need to search notes)
CREATE INDEX IF NOT EXISTS idx_transactions_notes ON public.transactions(notes);

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

-- Create a function to get daily payment metrics
CREATE OR REPLACE FUNCTION get_daily_payment_metrics(
  query_date timestamp with time zone DEFAULT now(),
  target_shop_id uuid DEFAULT NULL
)
RETURNS TABLE (
  payment_method text,
  total_amount numeric,
  transaction_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.payment_method,
    COALESCE(SUM(t.total_amount), 0) as total_amount,
    COUNT(*) as transaction_count
  FROM
    transactions t
  WHERE
    t.created_at >= date_trunc('day', query_date)
    AND t.created_at < date_trunc('day', query_date) + interval '1 day'
    AND t.type = 'SALE'
    AND (target_shop_id IS NULL OR t.shop_id = target_shop_id)
    AND t.payment_method IS NOT NULL
  GROUP BY
    t.payment_method;
END;
$$;

-- Add columns for shop-specific bill header details
ALTER TABLE "public"."shops" 
ADD COLUMN IF NOT EXISTS "company_name" TEXT,
ADD COLUMN IF NOT EXISTS "company_name_arabic" TEXT,
ADD COLUMN IF NOT EXISTS "cr_number" TEXT,
ADD COLUMN IF NOT EXISTS "address_line_1" TEXT,
ADD COLUMN IF NOT EXISTS "address_line_2" TEXT,
ADD COLUMN IF NOT EXISTS "address_line_3" TEXT,
ADD COLUMN IF NOT EXISTS "contact_number" TEXT;

-- Add comment to explain usage
COMMENT ON COLUMN "public"."shops"."company_name" IS 'Shop-specific company name for bill header';

COMMENT ON COLUMN "public"."shops"."company_name_arabic" IS 'Shop-specific arabic company name for bill header';

-- Add remaining columns for full bill customization
ALTER TABLE "public"."shops" 
ADD COLUMN IF NOT EXISTS "service_description_en" TEXT,
ADD COLUMN IF NOT EXISTS "service_description_ar" TEXT,
ADD COLUMN IF NOT EXISTS "thank_you_message" TEXT,
ADD COLUMN IF NOT EXISTS "brand_name" TEXT,
ADD COLUMN IF NOT EXISTS "brand_address" TEXT,
ADD COLUMN IF NOT EXISTS "brand_phones" TEXT,
ADD COLUMN IF NOT EXISTS "brand_whatsapp" TEXT;

COMMENT ON COLUMN "public"."shops"."service_description_en" IS 'Service description in English for bill';

COMMENT ON COLUMN "public"."shops"."service_description_ar" IS 'Service description in Arabic for bill';

COMMENT ON COLUMN "public"."shops"."thank_you_message" IS 'Footer thank you message';

CREATE OR REPLACE FUNCTION public.get_daily_sales(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(sale_date date, total_sales numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('day', created_at AT TIME ZONE 'Asia/Muscat')::date as sale_date,
    SUM(
      CASE 
        WHEN type = 'REFUND' THEN -total_amount 
        ELSE total_amount 
      END
    ) as total_sales
  FROM transactions
  WHERE created_at >= start_date
    AND created_at <= end_date
    AND (filter_shop_id IS NULL OR shop_id = filter_shop_id)
    AND type IN ('SALE', 'ON_HOLD_PAID', 'REFUND')
  GROUP BY 1
  ORDER BY 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_daily_payment_metrics(query_date timestamp with time zone DEFAULT now(), target_shop_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(payment_method text, total_amount numeric, transaction_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  day_start timestamp with time zone;
  day_end timestamp with time zone;
BEGIN
  -- Convert query_date to Muscat time to find the start of the day in that timezone
  -- Then convert back to UTC for searching the created_at column
  day_start := date_trunc('day', query_date AT TIME ZONE 'Asia/Muscat') AT TIME ZONE 'Asia/Muscat';
  day_end := day_start + interval '1 day';

  RETURN QUERY
  SELECT
    t.payment_method,
    COALESCE(SUM(t.total_amount), 0) as total_amount,
    COUNT(*) as transaction_count
  FROM
    transactions t
  WHERE
    t.created_at >= day_start
    AND t.created_at < day_end
    AND t.type = 'SALE'
    AND (target_shop_id IS NULL OR t.shop_id = target_shop_id)
    AND t.payment_method IS NOT NULL
  GROUP BY
    t.payment_method;
END;
$function$;

-- Migration: Create atomic checkout transaction function
-- Description: Handles the entire POS checkout process in a single DB call
-- Includes: Inventory validation, stock deduction, lubricant bottle management (FIFO), batch allocation, and transaction insertion.

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB, -- Array of cart items
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
BEGIN
  -- 1. Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Verify location exists
  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- 2. Determine Reference Number Prefix
  -- Check for battery items in the cart to set flag
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    -- Check if product is battery or in Battery category/type
    -- Using loose matching similar to application logic
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        p.is_battery = TRUE OR
        p.product_type ILIKE 'battery' OR 
        p.product_type ILIKE 'batteries' OR
        (c.name = 'Parts' AND (p.product_type ILIKE 'battery' OR p.product_type ILIKE 'batteries')) OR
        p.name ILIKE '%battery%' OR
        p.name ILIKE '%batteries%'
      )
    ) INTO v_is_battery_sale;
    
    IF v_is_battery_sale THEN
      EXIT; -- Found a battery, no need to check further
    END IF;
  END LOOP;

  -- Logic from getPrefixForTransaction
  IF v_is_battery_sale THEN
    v_ref_prefix := 'B';
  ELSE
    CASE UPPER(p_type)
      WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
      WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
      WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
      WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
      ELSE v_ref_prefix := 'A'; -- SALE, ON_HOLD_PAID, etc.
    END CASE;
  END IF;

  -- 3. Generate Reference Number (Atomic Increment)
  INSERT INTO reference_number_counters (prefix, counter, updated_at)
  VALUES (v_ref_prefix, 0, NOW())
  ON CONFLICT (prefix) DO UPDATE
  SET counter = reference_number_counters.counter + 1, updated_at = NOW()
  RETURNING counter INTO v_counter;

  -- Special safety to ensure we don't return 0
  IF v_counter = 0 THEN
      UPDATE reference_number_counters
      SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
  END IF;

  v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');

  -- 4. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); -- Default to CLOSED
    v_volume_desc := v_item->>'volumeDescription';

    -- Skip labor charges (ID 9999 or similar non-UUIDs handled by app, assuming DB only sees valid UUIDs or we skip)
    -- In app logic, '9999' is skipped for verification. Here we assume generic check.
    -- If product_id is not a UUID, this might fail unless we validate. 
    -- Assuming p_items contains valid UUIDs for products in DB.

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type to determine logic
    SELECT product_type ILIKE 'lubricant' INTO v_is_lubricant
    FROM products WHERE id = v_product_id;

    IF v_is_lubricant THEN
        -- LUBRICANT LOGIC
        -- Get max volume (bottle size) - simplified logic: max of (parsed numeric volume) from product_volumes
        -- Note: Parsing '4L', '1 Liter' etc in SQL is hard. We rely on the app passing correct volume logic or data.
        -- BUT the migration plan says we replicate the logic.
        -- We will attempt to find a matching numeric volume from product_volumes for safety, or fallback to 4.0
        -- For simplicity and performance, we assume 4.0 fallback if not found, similar to app.
        
        -- Try to extract numeric volume from product_volumes
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '^[0-9]+(\.[0-9]+)?')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        IF v_item_source = 'CLOSED' THEN
            IF v_closed_bottles < 1 THEN
                RAISE EXCEPTION 'No closed bottles available for product %', v_product_id;
            END IF;
            
            -- Deduct 1 closed bottle
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - 1
            WHERE id = v_inventory_id;
            
            -- Create new open bottle with remaining volume
            v_remaining_qty := v_bottle_size - v_quantity;
            IF v_remaining_qty < 0 THEN RAISE EXCEPTION 'Requested quantity exceeds bottle size'; END IF;
            
            INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
            VALUES (v_inventory_id, v_bottle_size, v_remaining_qty, (v_remaining_qty <= 0), NOW());
            
            -- If not empty immediately, increment open stock
            IF v_remaining_qty > 0 THEN
               UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
            END IF;

        ELSIF v_item_source = 'OPEN' THEN
            -- Consume from open bottles (FIFO)
            v_remaining_qty := v_quantity;
            
            -- Loop through open bottles
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- Bottle has enough
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    
                    -- If became empty, decrement open stock
                    IF (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
                        UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                    END IF;
                    
                    v_remaining_qty := 0;
                ELSE
                    -- Bottle doesn't have enough, drain it
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                    
                    UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                END IF;
            END LOOP;
            
            -- If still need volume, open a new closed bottle
            IF v_remaining_qty > 0 THEN
                IF v_closed_bottles < 1 THEN
                    RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
                END IF;
                 -- Deduct 1 closed bottle
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1 
                WHERE id = v_inventory_id;
                
                -- Create new open bottle
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                -- Safety check
                 IF v_new_open_vol < 0 THEN RAISE EXCEPTION 'Requested remainder exceeds new bottle size'; END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
                
                IF v_new_open_vol > 0 THEN
                   UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
                END IF;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        -- STANDARD PRODUCT LOGIC (Not Lubricant)
        -- Currently we allow negative stock for standard items in the app logic? 
        -- App logic: "standardStock = inventoryRecord.standardStock - quantity" -> updates DB.
        -- It doesn't explicitly throw if < 0 in the provided snippet, effectively allowing negative stock or letting DB constraints handle it.
        -- We will duplicate that behavior: just decrement.
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity
        WHERE id = v_inventory_id;
    END IF;

    -- BATCH ALLOCATION (FIFO)
    -- Logic: Find oldest active batches or batches with stock, consume valid stock.
    v_batch_remaining := v_quantity;
    
    FOR v_batch IN 
        SELECT id, stock_remaining
        FROM batches
        WHERE inventory_id = v_inventory_id 
          AND (is_active_batch = TRUE OR stock_remaining > 0)
        ORDER BY purchase_date ASC
        FOR UPDATE SKIP LOCKED -- Critical for concurrency
    LOOP
        IF v_batch_remaining <= 0 THEN EXIT; END IF;
        
        v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
        
        -- Update batch
        UPDATE batches
        SET stock_remaining = stock_remaining - v_batch_alloc,
            is_active_batch = (stock_remaining - v_batch_alloc > 0) -- Deactivate if empty? App logic implies checking next.
            -- Actually app logic says: "If the batch is exhausted, we deactivate it".
        WHERE id = v_batch.id;
        
        v_batch_remaining := v_batch_remaining - v_batch_alloc;
    END LOOP;
    
    -- Note: If v_batch_remaining > 0, we simply ran out of batch stock but still sold the item (standard_stock reduced).
    -- This is consistent with allowing sales even if batch tracking is slightly off.

  END LOOP;

  -- 5. Create Transaction Record
  INSERT INTO transactions (
    reference_number,
    location_id,
    shop_id,
    cashier_id,
    type,
    total_amount,
    items_sold,
    payment_method,
    car_plate_number,
    mobile_payment_account,
    mobile_number,
    customer_id,
    discount_type,
    discount_value,
    discount_amount,
    subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number,
    p_location_id,
    p_shop_id,
    p_cashier_id,
    p_type,
    p_total_amount,
    p_items,
    p_payment_method,
    p_car_plate_number,
    p_mobile_payment_account,
    p_mobile_number,
    p_customer_id,
    p_discount_type,
    p_discount_value,
    p_discount_amount,
    p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- 6. Return Result
  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Add trade-in logic to checkout transaction function
-- Description: Updates the checkout function to handle trade-in items atomically.

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB, -- Array of cart items
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL -- New parameter for trade-ins
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  
  -- Trade-in variables
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  -- 1. Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Verify location exists
  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- 2. Determine Reference Number Prefix
  -- Check for battery items in the cart to set flag
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    -- Check if product is battery or in Battery category/type
    -- Using loose matching similar to application logic
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        p.is_battery = TRUE OR
        p.product_type ILIKE 'battery' OR 
        p.product_type ILIKE 'batteries' OR
        (c.name = 'Parts' AND (p.product_type ILIKE 'battery' OR p.product_type ILIKE 'batteries')) OR
        p.name ILIKE '%battery%' OR
        p.name ILIKE '%batteries%'
      )
    ) INTO v_is_battery_sale;
    
    IF v_is_battery_sale THEN
      EXIT; -- Found a battery, no need to check further
    END IF;
  END LOOP;

  -- Logic from getPrefixForTransaction
  IF v_is_battery_sale THEN
    v_ref_prefix := 'B';
  ELSE
    CASE UPPER(p_type)
      WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
      WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
      WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
      WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
      ELSE v_ref_prefix := 'A'; -- SALE, ON_HOLD_PAID, etc.
    END CASE;
  END IF;

  -- 3. Generate Reference Number (Atomic Increment)
  INSERT INTO reference_number_counters (prefix, counter, updated_at)
  VALUES (v_ref_prefix, 0, NOW())
  ON CONFLICT (prefix) DO UPDATE
  SET counter = reference_number_counters.counter + 1, updated_at = NOW()
  RETURNING counter INTO v_counter;

  -- Special safety to ensure we don't return 0
  IF v_counter = 0 THEN
      UPDATE reference_number_counters
      SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
  END IF;

  v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');

  -- 4. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); -- Default to CLOSED
    v_volume_desc := v_item->>'volumeDescription';

    -- Skip labor charges (ID 9999 or similar non-UUIDs handled by app, assuming DB only sees valid UUIDs or we skip)
    -- In app logic, '9999' is skipped for verification. Here we assume generic check.
    -- If product_id is not a UUID, this might fail unless we validate. 
    -- Assuming p_items contains valid UUIDs for products in DB.

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type to determine logic
    SELECT product_type ILIKE 'lubricant' INTO v_is_lubricant
    FROM products WHERE id = v_product_id;

    IF v_is_lubricant THEN
        -- LUBRICANT LOGIC
        -- Get max volume (bottle size) - simplified logic: max of (parsed numeric volume) from product_volumes
        -- Note: Parsing '4L', '1 Liter' etc in SQL is hard. We rely on the app passing correct volume logic or data.
        -- We will attempt to find a matching numeric volume from product_volumes for safety, or fallback to 4.0
        -- For simplicity and performance, we assume 4.0 fallback if not found, similar to app.
        
        -- Try to extract numeric volume from product_volumes
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '^[0-9]+(\.[0-9]+)?')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        IF v_item_source = 'CLOSED' THEN
            IF v_closed_bottles < 1 THEN
                RAISE EXCEPTION 'No closed bottles available for product %', v_product_id;
            END IF;
            
            -- Deduct 1 closed bottle
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - 1
            WHERE id = v_inventory_id;
            
            -- Create new open bottle with remaining volume
            v_remaining_qty := v_bottle_size - v_quantity;
            IF v_remaining_qty < 0 THEN RAISE EXCEPTION 'Requested quantity exceeds bottle size'; END IF;
            
            INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
            VALUES (v_inventory_id, v_bottle_size, v_remaining_qty, (v_remaining_qty <= 0), NOW());
            
            -- If not empty immediately, increment open stock
            IF v_remaining_qty > 0 THEN
               UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
            END IF;

        ELSIF v_item_source = 'OPEN' THEN
            -- Consume from open bottles (FIFO)
            v_remaining_qty := v_quantity;
            
            -- Loop through open bottles
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- Bottle has enough
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    
                    -- If became empty, decrement open stock
                    IF (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
                        UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                    END IF;
                    
                    v_remaining_qty := 0;
                ELSE
                    -- Bottle doesn't have enough, drain it
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                    
                    UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                END IF;
            END LOOP;
            
            -- If still need volume, open a new closed bottle
            IF v_remaining_qty > 0 THEN
                IF v_closed_bottles < 1 THEN
                    RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
                END IF;
                 -- Deduct 1 closed bottle
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1 
                WHERE id = v_inventory_id;
                
                -- Create new open bottle
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                -- Safety check
                 IF v_new_open_vol < 0 THEN RAISE EXCEPTION 'Requested remainder exceeds new bottle size'; END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
                
                IF v_new_open_vol > 0 THEN
                   UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
                END IF;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        -- STANDARD PRODUCT LOGIC (Not Lubricant)
        -- Currently we allow negative stock for standard items in the app logic? 
        -- App logic: "standardStock = inventoryRecord.standardStock - quantity" -> updates DB.
        -- It doesn't explicitly throw if < 0 in the provided snippet, effectively allowing negative stock or letting DB constraints handle it.
        -- We will duplicate that behavior: just decrement.
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity
        WHERE id = v_inventory_id;
    END IF;

    -- BATCH ALLOCATION (FIFO)
    -- Logic: Find oldest active batches or batches with stock, consume valid stock.
    v_batch_remaining := v_quantity;
    
    FOR v_batch IN 
        SELECT id, stock_remaining
        FROM batches
        WHERE inventory_id = v_inventory_id 
          AND (is_active_batch = TRUE OR stock_remaining > 0)
        ORDER BY purchase_date ASC
        FOR UPDATE SKIP LOCKED -- Critical for concurrency
    LOOP
        IF v_batch_remaining <= 0 THEN EXIT; END IF;
        
        v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
        
        -- Update batch
        UPDATE batches
        SET stock_remaining = stock_remaining - v_batch_alloc,
            is_active_batch = (stock_remaining - v_batch_alloc > 0) -- Deactivate if empty? App logic implies checking next.
            -- Actually app logic says: "If the batch is exhausted, we deactivate it".
        WHERE id = v_batch.id;
        
        v_batch_remaining := v_batch_remaining - v_batch_alloc;
    END LOOP;
    
    -- Note: If v_batch_remaining > 0, we simply ran out of batch stock but still sold the item (standard_stock reduced).
    -- This is consistent with allowing sales even if batch tracking is slightly off.

  END LOOP;

  -- 5. Create Transaction Record
  INSERT INTO transactions (
    reference_number,
    location_id,
    shop_id,
    cashier_id,
    type,
    total_amount,
    items_sold,
    payment_method,
    car_plate_number,
    mobile_payment_account,
    mobile_number,
    customer_id,
    discount_type,
    discount_value,
    discount_amount,
    subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number,
    p_location_id,
    p_shop_id,
    p_cashier_id,
    p_type,
    p_total_amount,
    p_items,
    p_payment_method,
    p_car_plate_number,
    p_mobile_payment_account,
    p_mobile_number,
    p_customer_id,
    p_discount_type,
    p_discount_value,
    p_discount_amount,
    p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- 6. Process Trade-Ins
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      
      -- Helper: Find Parts Category and Battery Type only once (optimization)
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NULL THEN
          -- Fallback or error? App logic logged error but continued for non-battery trade-ins?
          -- We'll proceed but battery creation will fail if attempted.
          NULL; 
      END IF;

      FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
      LOOP
          v_ti_size := v_trade_in->>'size';
          v_ti_condition := v_trade_in->>'condition';
          v_ti_name := v_trade_in->>'name'; -- Should be something like "Trade-in battery - Size (Condition)"
          v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
          v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
          v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
          v_ti_product_id := (v_trade_in->>'productId')::UUID;
          
          -- Check if it's a battery trade-in
          IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL AND v_parts_category_id IS NOT NULL THEN
              -- 1. Find or Create Product
              -- Check if product exists by Name (to avoid duplicates) OR by passed ID if it's valid?
              -- App logic checked by Name first.
              
              SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
              
              IF v_ti_product_id IS NULL THEN
                  -- Create new product
                  -- Get selling price from trade_in_prices
                  SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices 
                  WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  
                  -- Fallback selling price?
                  IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;

                  INSERT INTO products (
                      name, 
                      category_id, 
                      type_id, 
                      product_type, 
                      description, 
                      is_battery, 
                      battery_state, 
                      cost_price
                  ) VALUES (
                      v_ti_name,
                      v_parts_category_id,
                      v_battery_type_id,
                      'Battery',
                      'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                      TRUE,
                      LOWER(v_ti_condition), -- 'scrap' or 'resellable' (app used 'resellable')
                      v_ti_cost_price
                  ) RETURNING id INTO v_ti_product_id;
                  
                  -- Insert volume entry? Not strictly needed for batteries but maybe nice? skipping for now.
              END IF;

              -- 2. Find or Create Inventory
              -- Need selling price again if we need to update it
               SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices 
                  WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  
              SELECT id INTO v_ti_inventory_id 
              FROM inventory 
              WHERE product_id = v_ti_product_id AND location_id = p_location_id;

              IF v_ti_inventory_id IS NOT NULL THEN
                  UPDATE inventory 
                  SET standard_stock = standard_stock + v_ti_quantity,
                      selling_price = COALESCE(v_ti_selling_price, selling_price)
                  WHERE id = v_ti_inventory_id;
              ELSE
                  INSERT INTO inventory (product_id, location_id, standard_stock, selling_price)
                  VALUES (v_ti_product_id, p_location_id, v_ti_quantity, v_ti_selling_price)
                  RETURNING id INTO v_ti_inventory_id;
              END IF;

              -- 3. Create Batch
              INSERT INTO batches (
                  inventory_id,
                  quantity_received,
                  stock_remaining,
                  cost_price,
                  supplier,
                  is_active_batch
              ) VALUES (
                  v_ti_inventory_id,
                  v_ti_quantity,
                  v_ti_quantity, -- Full stock available
                  v_ti_cost_price,
                  'Trade-in (' || v_ti_condition || ')',
                  TRUE
              );
              
              -- 4. Create Trade-In Transaction Record
              INSERT INTO trade_in_transactions (
                  transaction_id,
                  product_id,
                  quantity,
                  trade_in_value
              ) VALUES (
                  v_transaction_id,
                  v_ti_product_id,
                  v_ti_quantity,
                  v_ti_trade_in_value
              );
          END IF;
      END LOOP;
  END IF;

  -- 6. Return Result
  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Fix UUID casting error for trade-ins in checkout function
-- Description: Removes the strict UUID cast for trade-in product IDs as they may be temporary strings from the frontend.

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB, -- Array of cart items
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL -- New parameter for trade-ins
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  
  -- Trade-in variables
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  -- 1. Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Verify location exists
  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- 2. Determine Reference Number Prefix
  -- Check for battery items in the cart to set flag
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    -- Check if product is battery or in Battery category/type
    -- Using loose matching similar to application logic
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        p.is_battery = TRUE OR
        p.product_type ILIKE 'battery' OR 
        p.product_type ILIKE 'batteries' OR
        (c.name = 'Parts' AND (p.product_type ILIKE 'battery' OR p.product_type ILIKE 'batteries')) OR
        p.name ILIKE '%battery%' OR
        p.name ILIKE '%batteries%'
      )
    ) INTO v_is_battery_sale;
    
    IF v_is_battery_sale THEN
      EXIT; -- Found a battery, no need to check further
    END IF;
  END LOOP;

  -- Logic from getPrefixForTransaction
  IF v_is_battery_sale THEN
    v_ref_prefix := 'B';
  ELSE
    CASE UPPER(p_type)
      WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
      WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
      WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
      WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
      ELSE v_ref_prefix := 'A'; -- SALE, ON_HOLD_PAID, etc.
    END CASE;
  END IF;

  -- 3. Generate Reference Number (Atomic Increment)
  INSERT INTO reference_number_counters (prefix, counter, updated_at)
  VALUES (v_ref_prefix, 0, NOW())
  ON CONFLICT (prefix) DO UPDATE
  SET counter = reference_number_counters.counter + 1, updated_at = NOW()
  RETURNING counter INTO v_counter;

  -- Special safety to ensure we don't return 0
  IF v_counter = 0 THEN
      UPDATE reference_number_counters
      SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
  END IF;

  v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');

  -- 4. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); -- Default to CLOSED
    v_volume_desc := v_item->>'volumeDescription';

    -- Skip labor charges (ID 9999 or similar non-UUIDs handled by app, assuming DB only sees valid UUIDs or we skip)
    -- In app logic, '9999' is skipped for verification. Here we assume generic check.
    -- If product_id is not a UUID, this might fail unless we validate. 
    -- Assuming p_items contains valid UUIDs for products in DB.

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type to determine logic
    SELECT product_type ILIKE 'lubricant' INTO v_is_lubricant
    FROM products WHERE id = v_product_id;

    IF v_is_lubricant THEN
        -- LUBRICANT LOGIC
        -- Get max volume (bottle size) - simplified logic: max of (parsed numeric volume) from product_volumes
        -- Note: Parsing '4L', '1 Liter' etc in SQL is hard. We rely on the app passing correct volume logic or data.
        -- We will attempt to find a matching numeric volume from product_volumes for safety, or fallback to 4.0
        -- For simplicity and performance, we assume 4.0 fallback if not found, similar to app.
        
        -- Try to extract numeric volume from product_volumes
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '^[0-9]+(\.[0-9]+)?')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        IF v_item_source = 'CLOSED' THEN
            IF v_closed_bottles < 1 THEN
                RAISE EXCEPTION 'No closed bottles available for product %', v_product_id;
            END IF;
            
            -- Deduct 1 closed bottle
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - 1
            WHERE id = v_inventory_id;
            
            -- Create new open bottle with remaining volume
            v_remaining_qty := v_bottle_size - v_quantity;
            IF v_remaining_qty < 0 THEN RAISE EXCEPTION 'Requested quantity exceeds bottle size'; END IF;
            
            INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
            VALUES (v_inventory_id, v_bottle_size, v_remaining_qty, (v_remaining_qty <= 0), NOW());
            
            -- If not empty immediately, increment open stock
            IF v_remaining_qty > 0 THEN
               UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
            END IF;

        ELSIF v_item_source = 'OPEN' THEN
            -- Consume from open bottles (FIFO)
            v_remaining_qty := v_quantity;
            
            -- Loop through open bottles
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- Bottle has enough
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    
                    -- If became empty, decrement open stock
                    IF (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
                        UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                    END IF;
                    
                    v_remaining_qty := 0;
                ELSE
                    -- Bottle doesn't have enough, drain it
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                    
                    UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                END IF;
            END LOOP;
            
            -- If still need volume, open a new closed bottle
            IF v_remaining_qty > 0 THEN
                IF v_closed_bottles < 1 THEN
                    RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
                END IF;
                 -- Deduct 1 closed bottle
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1 
                WHERE id = v_inventory_id;
                
                -- Create new open bottle
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                -- Safety check
                 IF v_new_open_vol < 0 THEN RAISE EXCEPTION 'Requested remainder exceeds new bottle size'; END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
                
                IF v_new_open_vol > 0 THEN
                   UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
                END IF;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        -- STANDARD PRODUCT LOGIC (Not Lubricant)
        -- Currently we allow negative stock for standard items in the app logic? 
        -- App logic: "standardStock = inventoryRecord.standardStock - quantity" -> updates DB.
        -- It doesn't explicitly throw if < 0 in the provided snippet, effectively allowing negative stock or letting DB constraints handle it.
        -- We will duplicate that behavior: just decrement.
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity
        WHERE id = v_inventory_id;
    END IF;

    -- BATCH ALLOCATION (FIFO)
    -- Logic: Find oldest active batches or batches with stock, consume valid stock.
    v_batch_remaining := v_quantity;
    
    FOR v_batch IN 
        SELECT id, stock_remaining
        FROM batches
        WHERE inventory_id = v_inventory_id 
          AND (is_active_batch = TRUE OR stock_remaining > 0)
        ORDER BY purchase_date ASC
        FOR UPDATE SKIP LOCKED -- Critical for concurrency
    LOOP
        IF v_batch_remaining <= 0 THEN EXIT; END IF;
        
        v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
        
        -- Update batch
        UPDATE batches
        SET stock_remaining = stock_remaining - v_batch_alloc,
            is_active_batch = (stock_remaining - v_batch_alloc > 0) -- Deactivate if empty? App logic implies checking next.
            -- Actually app logic says: "If the batch is exhausted, we deactivate it".
        WHERE id = v_batch.id;
        
        v_batch_remaining := v_batch_remaining - v_batch_alloc;
    END LOOP;
    
    -- Note: If v_batch_remaining > 0, we simply ran out of batch stock but still sold the item (standard_stock reduced).
    -- This is consistent with allowing sales even if batch tracking is slightly off.

  END LOOP;

  -- 5. Create Transaction Record
  INSERT INTO transactions (
    reference_number,
    location_id,
    shop_id,
    cashier_id,
    type,
    total_amount,
    items_sold,
    payment_method,
    car_plate_number,
    mobile_payment_account,
    mobile_number,
    customer_id,
    discount_type,
    discount_value,
    discount_amount,
    subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number,
    p_location_id,
    p_shop_id,
    p_cashier_id,
    p_type,
    p_total_amount,
    p_items,
    p_payment_method,
    p_car_plate_number,
    p_mobile_payment_account,
    p_mobile_number,
    p_customer_id,
    p_discount_type,
    p_discount_value,
    p_discount_amount,
    p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- 6. Process Trade-Ins
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      
      -- Helper: Find Parts Category and Battery Type only once (optimization)
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NULL THEN
          -- Fallback or error? App logic logged error but continued for non-battery trade-ins?
          -- We'll proceed but battery creation will fail if attempted.
          NULL; 
      END IF;

      FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
      LOOP
          v_ti_size := v_trade_in->>'size';
          v_ti_condition := v_trade_in->>'condition';
          v_ti_name := v_trade_in->>'name';
          v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
          v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
          v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
          
          -- Initialize product ID to NULL. Do NOT cast strict UUID here as it might be a temp string.
          v_ti_product_id := NULL;
          
          -- Check if it's a battery trade-in
          IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL AND v_parts_category_id IS NOT NULL THEN
              -- 1. Find or Create Product
              
              -- Try to find by NAME first (deduplication)
              SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
              
              IF v_ti_product_id IS NULL THEN
                  -- Create new product
                  -- Get selling price from trade_in_prices
                  SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices 
                  WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  
                  -- Fallback selling price?
                  IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;

                  INSERT INTO products (
                      name, 
                      category_id, 
                      type_id, 
                      product_type, 
                      description, 
                      is_battery, 
                      battery_state, 
                      cost_price
                  ) VALUES (
                      v_ti_name,
                      v_parts_category_id,
                      v_battery_type_id,
                      'Battery',
                      'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                      TRUE,
                      LOWER(v_ti_condition), -- 'scrap' or 'resellable'
                      v_ti_cost_price
                  ) RETURNING id INTO v_ti_product_id;
                  
              END IF;

              -- 2. Find or Create Inventory
              -- Need selling price again if we need to update it
               SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices 
                  WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  
              SELECT id INTO v_ti_inventory_id 
              FROM inventory 
              WHERE product_id = v_ti_product_id AND location_id = p_location_id;

              IF v_ti_inventory_id IS NOT NULL THEN
                  UPDATE inventory 
                  SET standard_stock = standard_stock + v_ti_quantity,
                      selling_price = COALESCE(v_ti_selling_price, selling_price)
                  WHERE id = v_ti_inventory_id;
              ELSE
                  INSERT INTO inventory (product_id, location_id, standard_stock, selling_price)
                  VALUES (v_ti_product_id, p_location_id, v_ti_quantity, v_ti_selling_price)
                  RETURNING id INTO v_ti_inventory_id;
              END IF;

              -- 3. Create Batch
              INSERT INTO batches (
                  inventory_id,
                  quantity_received,
                  stock_remaining,
                  cost_price,
                  supplier,
                  is_active_batch
              ) VALUES (
                  v_ti_inventory_id,
                  v_ti_quantity,
                  v_ti_quantity, -- Full stock available
                  v_ti_cost_price,
                  'Trade-in (' || v_ti_condition || ')',
                  TRUE
              );
              
              -- 4. Create Trade-In Transaction Record
              INSERT INTO trade_in_transactions (
                  transaction_id,
                  product_id,
                  quantity,
                  trade_in_value
              ) VALUES (
                  v_transaction_id,
                  v_ti_product_id,
                  v_ti_quantity,
                  v_ti_trade_in_value
              );
          END IF;
      END LOOP;
  END IF;

  -- 6. Return Result
  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

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

-- 7. Add index for batch_number queries
CREATE INDEX IF NOT EXISTS idx_batches_inventory_batch_number 
ON batches(inventory_id, batch_number);

-- Migration: Fix batch active status rollover in checkout transaction
-- Description: Ensures that when an active batch is exhausted, the next available batch is automatically marked as active.

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB, -- Array of cart items
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL -- New parameter for trade-ins
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  
  -- Trade-in variables
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  -- 1. Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Verify location exists
  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- 2. Determine Reference Number Prefix
  -- Check for battery items in the cart to set flag
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    -- Check if product is battery or in Battery category/type
    -- Using loose matching similar to application logic
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        p.is_battery = TRUE OR
        p.product_type ILIKE 'battery' OR 
        p.product_type ILIKE 'batteries' OR
        (c.name = 'Parts' AND (p.product_type ILIKE 'battery' OR p.product_type ILIKE 'batteries')) OR
        p.name ILIKE '%battery%' OR
        p.name ILIKE '%batteries%'
      )
    ) INTO v_is_battery_sale;
    
    IF v_is_battery_sale THEN
      EXIT; -- Found a battery, no need to check further
    END IF;
  END LOOP;

  -- Logic from getPrefixForTransaction
  IF v_is_battery_sale THEN
    v_ref_prefix := 'B';
  ELSE
    CASE UPPER(p_type)
      WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
      WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
      WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
      WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
      ELSE v_ref_prefix := 'A'; -- SALE, ON_HOLD_PAID, etc.
    END CASE;
  END IF;

  -- 3. Generate Reference Number (Atomic Increment)
  INSERT INTO reference_number_counters (prefix, counter, updated_at)
  VALUES (v_ref_prefix, 0, NOW())
  ON CONFLICT (prefix) DO UPDATE
  SET counter = reference_number_counters.counter + 1, updated_at = NOW()
  RETURNING counter INTO v_counter;

  -- Special safety to ensure we don't return 0
  IF v_counter = 0 THEN
      UPDATE reference_number_counters
      SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
  END IF;

  v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');

  -- 4. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); -- Default to CLOSED
    v_volume_desc := v_item->>'volumeDescription';

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type to determine logic
    SELECT product_type ILIKE 'lubricant' INTO v_is_lubricant
    FROM products WHERE id = v_product_id;

    IF v_is_lubricant THEN
        -- LUBRICANT LOGIC
        -- Try to extract numeric volume from product_volumes
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '^[0-9]+(\.[0-9]+)?')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        IF v_item_source = 'CLOSED' THEN
            IF v_closed_bottles < 1 THEN
                RAISE EXCEPTION 'No closed bottles available for product %', v_product_id;
            END IF;
            
            -- Deduct 1 closed bottle
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - 1
            WHERE id = v_inventory_id;
            
            -- Create new open bottle with remaining volume
            v_remaining_qty := v_bottle_size - v_quantity;
            IF v_remaining_qty < 0 THEN RAISE EXCEPTION 'Requested quantity exceeds bottle size'; END IF;
            
            INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
            VALUES (v_inventory_id, v_bottle_size, v_remaining_qty, (v_remaining_qty <= 0), NOW());
            
            -- If not empty immediately, increment open stock
            IF v_remaining_qty > 0 THEN
               UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
            END IF;

        ELSIF v_item_source = 'OPEN' THEN
            -- Consume from open bottles (FIFO)
            v_remaining_qty := v_quantity;
            
            -- Loop through open bottles
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- Bottle has enough
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    
                    -- If became empty, decrement open stock
                    IF (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
                        UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                    END IF;
                    
                    v_remaining_qty := 0;
                ELSE
                    -- Bottle doesn't have enough, drain it
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                    
                    UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                END IF;
            END LOOP;
            
            -- If still need volume, open a new closed bottle
            IF v_remaining_qty > 0 THEN
                IF v_closed_bottles < 1 THEN
                    RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
                END IF;
                 -- Deduct 1 closed bottle
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1 
                WHERE id = v_inventory_id;
                
                -- Create new open bottle
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                -- Safety check
                 IF v_new_open_vol < 0 THEN RAISE EXCEPTION 'Requested remainder exceeds new bottle size'; END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
                
                IF v_new_open_vol > 0 THEN
                   UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
                END IF;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        -- STANDARD PRODUCT LOGIC (Not Lubricant)
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity
        WHERE id = v_inventory_id;
    END IF;

    -- BATCH ALLOCATION (FIFO)
    v_batch_remaining := v_quantity;
    
    FOR v_batch IN 
        SELECT id, stock_remaining
        FROM batches
        WHERE inventory_id = v_inventory_id 
          AND (is_active_batch = TRUE OR stock_remaining > 0)
        ORDER BY purchase_date ASC, batch_number ASC
        FOR UPDATE SKIP LOCKED
    LOOP
        IF v_batch_remaining <= 0 THEN EXIT; END IF;
        
        v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
        
        -- Update batch
        UPDATE batches
        SET stock_remaining = stock_remaining - v_batch_alloc,
            is_active_batch = (stock_remaining - v_batch_alloc > 0) -- Deactivate if empty
        WHERE id = v_batch.id;
        
        v_batch_remaining := v_batch_remaining - v_batch_alloc;
    END LOOP;
    
    -- ROLLOVER LOGIC: Ensure we have an active batch if stock exists
    -- This section is NEW to fix the issue where next batch doesn't activate
    IF NOT EXISTS (
        SELECT 1 FROM batches 
        WHERE inventory_id = v_inventory_id 
          AND is_active_batch = true 
          AND stock_remaining > 0
    ) THEN
        -- Activate the oldest batch that has stock
        UPDATE batches
        SET is_active_batch = true
        WHERE id = (
            SELECT id FROM batches
            WHERE inventory_id = v_inventory_id 
              AND stock_remaining > 0
            ORDER BY purchase_date ASC, batch_number ASC
            LIMIT 1
        );
    END IF;

  END LOOP;

  -- 5. Create Transaction Record
  INSERT INTO transactions (
    reference_number,
    location_id,
    shop_id,
    cashier_id,
    type,
    total_amount,
    items_sold,
    payment_method,
    car_plate_number,
    mobile_payment_account,
    mobile_number,
    customer_id,
    discount_type,
    discount_value,
    discount_amount,
    subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number,
    p_location_id,
    p_shop_id,
    p_cashier_id,
    p_type,
    p_total_amount,
    p_items,
    p_payment_method,
    p_car_plate_number,
    p_mobile_payment_account,
    p_mobile_number,
    p_customer_id,
    p_discount_type,
    p_discount_value,
    p_discount_amount,
    p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- 6. Process Trade-Ins
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      
      -- Helper: Find Parts Category and Battery Type only once (optimization)
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NULL THEN
          NULL; 
      END IF;

      FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
      LOOP
          v_ti_size := v_trade_in->>'size';
          v_ti_condition := v_trade_in->>'condition';
          v_ti_name := v_trade_in->>'name';
          v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
          v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
          v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
          
          v_ti_product_id := NULL;
          
          -- Check if it's a battery trade-in
          IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL AND v_parts_category_id IS NOT NULL THEN
              -- 1. Find or Create Product
              
              -- Try to find by NAME first 
              SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
              
              IF v_ti_product_id IS NULL THEN
                  -- Create new product
                  SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices 
                  WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  
                  IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;

                  INSERT INTO products (
                      name, 
                      category_id, 
                      type_id, 
                      product_type, 
                      description, 
                      is_battery, 
                      battery_state, 
                      cost_price
                  ) VALUES (
                      v_ti_name,
                      v_parts_category_id,
                      v_battery_type_id,
                      'Battery',
                      'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                      TRUE,
                      LOWER(v_ti_condition), -- 'scrap' or 'resellable'
                      v_ti_cost_price
                  ) RETURNING id INTO v_ti_product_id;
                  
              END IF;

              -- 2. Find or Create Inventory
               SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices 
                  WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  
              SELECT id INTO v_ti_inventory_id 
              FROM inventory 
              WHERE product_id = v_ti_product_id AND location_id = p_location_id;

              IF v_ti_inventory_id IS NOT NULL THEN
                  UPDATE inventory 
                  SET standard_stock = standard_stock + v_ti_quantity,
                      selling_price = COALESCE(v_ti_selling_price, selling_price)
                  WHERE id = v_ti_inventory_id;
              ELSE
                  INSERT INTO inventory (product_id, location_id, standard_stock, selling_price)
                  VALUES (v_ti_product_id, p_location_id, v_ti_quantity, v_ti_selling_price)
                  RETURNING id INTO v_ti_inventory_id;
              END IF;

              -- 3. Create Batch
              INSERT INTO batches (
                  inventory_id,
                  quantity_received,
                  stock_remaining,
                  cost_price,
                  supplier,
                  is_active_batch
              ) VALUES (
                  v_ti_inventory_id,
                  v_ti_quantity,
                  v_ti_quantity,
                  v_ti_cost_price,
                  'Trade-in (' || v_ti_condition || ')',
                  TRUE
              );
              
              -- 4. Create Trade-In Transaction Record
              INSERT INTO trade_in_transactions (
                  transaction_id,
                  product_id,
                  quantity,
                  trade_in_value
              ) VALUES (
                  v_transaction_id,
                  v_ti_product_id,
                  v_ti_quantity,
                  v_ti_trade_in_value
              );
          END IF;
      END LOOP;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Fix open bottle checkout stock deduction
-- Description: Ensures batches (closed bottles) are only deducted when a closed bottle is actually consumed.
--              Corrects logic for Lubricants where "batch stock" = "bottle count" but "open sale" = "volume".

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB, -- Array of cart items
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_batch_deduction NUMERIC; -- NEW: Track actual batch units to deduct
BEGIN
  -- 1. Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Verify location exists
  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- 2. Determine Reference Number Prefix
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        p.is_battery = TRUE OR
        p.product_type ILIKE 'battery' OR 
        p.product_type ILIKE 'batteries' OR
        (c.name = 'Parts' AND (p.product_type ILIKE 'battery' OR p.product_type ILIKE 'batteries')) OR
        p.name ILIKE '%battery%' OR
        p.name ILIKE '%batteries%'
      )
    ) INTO v_is_battery_sale;
    
    IF v_is_battery_sale THEN
      EXIT; 
    END IF;
  END LOOP;

  IF v_is_battery_sale THEN
    v_ref_prefix := 'B';
  ELSE
    CASE UPPER(p_type)
      WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
      WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
      WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
      WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
      ELSE v_ref_prefix := 'A';
    END CASE;
  END IF;

  -- 3. Generate Reference Number
  INSERT INTO reference_number_counters (prefix, counter, updated_at)
  VALUES (v_ref_prefix, 0, NOW())
  ON CONFLICT (prefix) DO UPDATE
  SET counter = reference_number_counters.counter + 1, updated_at = NOW()
  RETURNING counter INTO v_counter;

  IF v_counter = 0 THEN
      UPDATE reference_number_counters
      SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
  END IF;

  v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');

  -- 4. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; -- Reset for this item

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type
    SELECT product_type ILIKE 'lubricant' INTO v_is_lubricant
    FROM products WHERE id = v_product_id;

    IF v_is_lubricant THEN
        -- LUBRICANT LOGIC

        -- Resolve Bottle Size (for Open Sales calculation)
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '^[0-9]+(\.[0-9]+)?')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        IF v_item_source = 'CLOSED' THEN
            -- Treated as UNIT COUNT (selling X full bottles)
            
            IF v_closed_bottles < v_quantity THEN
                RAISE EXCEPTION 'No closed bottles available for product % (Requested: %, Available: %)', v_product_id, v_quantity, v_closed_bottles;
            END IF;
            
            -- Deduct closed bottles (cleanly)
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - v_quantity::INTEGER
            WHERE id = v_inventory_id;
            
            -- We consumed exactly v_quantity bottles
            v_batch_deduction := v_quantity;
            
            -- Note: We do NOT create an open_bottle_detail here because the customer bought the CLOSED bottle.
            -- It leaves the shop sealed.

        ELSIF v_item_source = 'OPEN' THEN
            -- Treated as VOLUME SALW (selling X amount in Liters)
            
            -- Consume from open bottles (FIFO)
            v_remaining_qty := v_quantity;
            
            -- Loop through existing open bottles
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- This bottle has enough
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    
                    -- If became empty, update inventory availability count
                    IF (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
                        UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                    END IF;
                    
                    v_remaining_qty := 0;
                ELSE
                    -- Drain this bottle
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                    
                    UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                END IF;
            END LOOP;
            
            -- If still need volume, open a new closed bottle (Overflow)
            IF v_remaining_qty > 0 THEN
                IF v_closed_bottles < 1 THEN
                    RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
                END IF;
                
                 -- Open ONE closed bottle (Limit: can't overflow more than one bottle in single item currently)
                 -- Refinement: We could support multiple, but sticking to existing logic limit for safety.
                 
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1 
                WHERE id = v_inventory_id;
                
                -- We cracked open 1 bottle for this sale
                v_batch_deduction := 1; 
                
                -- Determine new open bottle volume
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Multi-bottle overflow not supported in single line item.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
                
                -- If the new bottle isn't instantly empty (sold exact amount), increment open stock
                IF v_new_open_vol > 0 THEN
                   UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
                END IF;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        -- STANDARD PRODUCT LOGIC
        -- Allow negative stock (current behavior)
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity
        WHERE id = v_inventory_id;
        
        v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO)
    -- Logic: Find oldest active batches or batches with stock, consume valid stock.
    -- ONLY IF we established a deduction amount.
    
    v_batch_remaining := v_batch_deduction;
    
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
            
            -- Update batch
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_alloc,
                is_active_batch = (stock_remaining - v_batch_alloc > 0)
            WHERE id = v_batch.id;
            
            v_batch_remaining := v_batch_remaining - v_batch_alloc;
        END LOOP;
    END IF;
    -- If v_batch_remaining > 0 here, it means we don't have enough batch stock 
    -- but we proceeded with the sale (standard behavior).

  END LOOP;

  -- 5. Create Transaction Record
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: FAST_FORWARD Fix Open Bottle Checkout (Final)
-- Description: Merges Open Bottle Logic Fix with existing Trade-In and Batch Rollover Logic.
--              Replaces create_checkout_transaction with 17 arguments to match application usage.
--              CLEANUP: Drops the incorrect 16-argument overload if it exists.

DROP FUNCTION IF EXISTS create_checkout_transaction(
  UUID, UUID, UUID, JSONB, NUMERIC, TEXT, TEXT, UUID, NUMERIC, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB, -- Array of cart items
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL -- Preserved parameter
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  
  v_batch_deduction NUMERIC; -- NEW: Track actual batch units to deduct

  -- Trade-in variables
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  -- 1. Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Verify location exists
  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- 2. Determine Reference Number Prefix
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        p.is_battery = TRUE OR
        p.product_type ILIKE 'battery' OR 
        p.product_type ILIKE 'batteries' OR
        (c.name = 'Parts' AND (p.product_type ILIKE 'battery' OR p.product_type ILIKE 'batteries')) OR
        p.name ILIKE '%battery%' OR
        p.name ILIKE '%batteries%'
      )
    ) INTO v_is_battery_sale;
    
    IF v_is_battery_sale THEN
      EXIT; 
    END IF;
  END LOOP;

  IF v_is_battery_sale THEN
    v_ref_prefix := 'B';
  ELSE
    CASE UPPER(p_type)
      WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
      WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
      WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
      WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
      ELSE v_ref_prefix := 'A';
    END CASE;
  END IF;

  -- 3. Generate Reference Number
  INSERT INTO reference_number_counters (prefix, counter, updated_at)
  VALUES (v_ref_prefix, 0, NOW())
  ON CONFLICT (prefix) DO UPDATE
  SET counter = reference_number_counters.counter + 1, updated_at = NOW()
  RETURNING counter INTO v_counter;

  IF v_counter = 0 THEN
      UPDATE reference_number_counters
      SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
  END IF;

  v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');

  -- 4. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; -- Reset

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type - ROBUST LUBRICANT CHECK
    -- Checks product_type AND category for keywords like 'lubricant', 'oil', 'fluid'
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        (p.product_type IS NOT NULL AND (p.product_type ILIKE 'lubricant%' OR p.product_type ILIKE 'oil%' OR p.product_type ILIKE 'fluid%')) OR
        (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%'))
      ) 
    ) INTO v_is_lubricant;

    IF v_is_lubricant THEN
        -- LUBRICANT LOGIC

        -- Resolve Bottle Size
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '^[0-9]+(\.[0-9]+)?')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        IF v_item_source = 'CLOSED' THEN
            -- [FIX]: Treat v_quantity as BOTTLE COUNT
            
            IF v_closed_bottles < v_quantity THEN
                RAISE EXCEPTION 'No closed bottles available for product % (Requested: %, Available: %)', v_product_id, v_quantity, v_closed_bottles;
            END IF;
            
            -- Deduct closed bottles
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - v_quantity::INTEGER
            WHERE id = v_inventory_id;
            
            -- Batch deduction is exactly the quantity (Bottles)
            v_batch_deduction := v_quantity;

        ELSIF v_item_source = 'OPEN' THEN
            -- [FIX]: Treat v_quantity as VOLUME (Liters)
            
            -- Consume from open bottles (FIFO)
            v_remaining_qty := v_quantity;
            
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- This bottle has enough
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    
                    if (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
                        UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                    END IF;
                    
                    v_remaining_qty := 0;
                ELSE
                    -- Drain this bottle
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                    
                    UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                END IF;
            END LOOP;
            
            -- If still need volume, open a new closed bottle (Overflow)
            IF v_remaining_qty > 0 THEN
                IF v_closed_bottles < 1 THEN
                    RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
                END IF;
                
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1 
                WHERE id = v_inventory_id;
                
                -- We cracked open 1 bottle for this sale
                v_batch_deduction := 1; 
                
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
                
                IF v_new_open_vol > 0 THEN
                   UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
                END IF;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        -- STANDARD PRODUCT
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity
        WHERE id = v_inventory_id;
        
        v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO) --
    -- Use v_batch_deduction instead of v_quantity directly
    v_batch_remaining := v_batch_deduction; -- [FIXED]
    
    -- Only process batches if there is something to deduct
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC, batch_number ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
            
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_alloc,
                is_active_batch = (stock_remaining - v_batch_alloc > 0)
            WHERE id = v_batch.id;
            
            v_batch_remaining := v_batch_remaining - v_batch_alloc;
        END LOOP;
        
        -- ROLLOVER LOGIC (Preserved from 20260113220000)
        IF NOT EXISTS (
            SELECT 1 FROM batches 
            WHERE inventory_id = v_inventory_id 
              AND is_active_batch = true 
              AND stock_remaining > 0
        ) THEN
            UPDATE batches
            SET is_active_batch = true
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id 
                  AND stock_remaining > 0
                ORDER BY purchase_date ASC, batch_number ASC
                LIMIT 1
            );
        END IF;
    END IF;

  END LOOP;
  
  -- 5. Create Transaction Record
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- 6. Process Trade-Ins (Preserved)
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NULL THEN NULL; END IF;

      FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
      LOOP
          v_ti_size := v_trade_in->>'size';
          v_ti_condition := v_trade_in->>'condition';
          v_ti_name := v_trade_in->>'name';
          v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
          v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
          v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
          v_ti_product_id := NULL;
          
          IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL AND v_parts_category_id IS NOT NULL THEN
              SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
              IF v_ti_product_id IS NULL THEN
                  SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                  INSERT INTO products (
                      name, category_id, type_id, product_type, description, is_battery, battery_state, cost_price
                  ) VALUES (
                      v_ti_name, v_parts_category_id, v_battery_type_id, 'Battery',
                      'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                      TRUE, LOWER(v_ti_condition), v_ti_cost_price
                  ) RETURNING id INTO v_ti_product_id;
              END IF;
              SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
              SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
              IF v_ti_inventory_id IS NOT NULL THEN
                  UPDATE inventory SET standard_stock = standard_stock + v_ti_quantity, selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
              ELSE
                  INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, v_ti_quantity, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
              END IF;
              INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
              INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
          END IF;
      END LOOP;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Fix Partial Bottle Creation
-- Description: Updates create_checkout_transaction to correctly handle partial volume sales from CLOSED source.
--              When a partial volume (e.g., 1L) is sold from a CLOSED bottle (e.g., 4L), 
--              it should deduct 1 closed bottle AND create a new open bottle with the remainder (3L).

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB, -- Array of cart items
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL -- Preserved parameter
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  
  v_batch_deduction NUMERIC; 
  
  -- New variables for partial bottle fix
  v_unit_sold_volume NUMERIC;
  v_remainder_per_bottle NUMERIC;

  -- Trade-in variables
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  -- 1. Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Verify location exists
  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- 2. Determine Reference Number Prefix
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        p.is_battery = TRUE OR
        p.product_type ILIKE 'battery' OR 
        p.product_type ILIKE 'batteries' OR
        (c.name = 'Parts' AND (p.product_type ILIKE 'battery' OR p.product_type ILIKE 'batteries')) OR
        p.name ILIKE '%battery%' OR
        p.name ILIKE '%batteries%'
      )
    ) INTO v_is_battery_sale;
    
    IF v_is_battery_sale THEN
      EXIT; 
    END IF;
  END LOOP;

  IF v_is_battery_sale THEN
    v_ref_prefix := 'B';
  ELSE
    CASE UPPER(p_type)
      WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
      WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
      WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
      WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
      ELSE v_ref_prefix := 'A';
    END CASE;
  END IF;

  -- 3. Generate Reference Number
  INSERT INTO reference_number_counters (prefix, counter, updated_at)
  VALUES (v_ref_prefix, 0, NOW())
  ON CONFLICT (prefix) DO UPDATE
  SET counter = reference_number_counters.counter + 1, updated_at = NOW()
  RETURNING counter INTO v_counter;

  IF v_counter = 0 THEN
      UPDATE reference_number_counters
      SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
  END IF;

  v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');

  -- 4. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; -- Reset

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type - ROBUST LUBRICANT CHECK
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        (p.product_type IS NOT NULL AND (p.product_type ILIKE 'lubricant%' OR p.product_type ILIKE 'oil%' OR p.product_type ILIKE 'fluid%')) OR
        (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%'))
      ) 
    ) INTO v_is_lubricant;

    IF v_is_lubricant THEN
        -- LUBRICANT LOGIC

        -- Resolve Bottle Size
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '^[0-9]+(\.[0-9]+)?')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        -- [NEW]: Resolve Unit Volume for ALL lubricant sales (Common Logic)
        IF v_volume_desc IS NOT NULL THEN
             v_unit_sold_volume := (
                CASE 
                    WHEN v_volume_desc ~ '^[0-9]+(\.[0-9]+)?$' THEN v_volume_desc::NUMERIC
                    WHEN v_volume_desc ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(v_volume_desc from '^([0-9]+(\.[0-9]+)?)')::NUMERIC
                    ELSE v_bottle_size -- Default to full bottle if parsing fails
                END
             );
        ELSE
             v_unit_sold_volume := v_bottle_size;
        END IF;

        IF v_item_source = 'CLOSED' THEN
            -- [FIX]: Treat v_quantity as BOTTLE COUNT
            
            IF v_closed_bottles < v_quantity THEN
                RAISE EXCEPTION 'No closed bottles available for product % (Requested: %, Available: %)', v_product_id, v_quantity, v_closed_bottles;
            END IF;
            
            -- Deduct closed bottles
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - v_quantity::INTEGER
            WHERE id = v_inventory_id;
            
            -- If sold volume is less than bottle size, create open bottle with remainder
            IF v_unit_sold_volume < v_bottle_size THEN
                 v_remainder_per_bottle := v_bottle_size - v_unit_sold_volume;
                 
                  -- Insert N open bottles (where N = v_quantity)
                 INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                 SELECT v_inventory_id, v_bottle_size, v_remainder_per_bottle, FALSE, NOW()
                 FROM generate_series(1, v_quantity::INTEGER);
                 
                 -- Increment open_bottles_stock by N
                 UPDATE inventory 
                 SET open_bottles_stock = open_bottles_stock + v_quantity::INTEGER
                 WHERE id = v_inventory_id;

                 -- Log specifically for debugging
                 RAISE NOTICE 'Auto-created % open bottles with %L remaining for product %', v_quantity, v_remainder_per_bottle, v_product_id;
            END IF;

            -- Batch deduction is exactly the quantity (Bottles)
            v_batch_deduction := v_quantity;

        ELSIF v_item_source = 'OPEN' THEN
            -- [FIX]: Treat v_quantity as Count of Units * Unit Volume
            
            -- Calculate Total Volume to Deduct in Liters
            v_remaining_qty := v_quantity * v_unit_sold_volume;
            
            -- Consume from open bottles (FIFO)
            
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- This bottle has enough
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    
                    if (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
                        UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                    END IF;
                    
                    v_remaining_qty := 0;
                ELSE
                    -- Drain this bottle
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                    
                    UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                END IF;
            END LOOP;
            
            -- If still need volume, open a new closed bottle (Overflow)
            IF v_remaining_qty > 0 THEN
                IF v_closed_bottles < 1 THEN
                    RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
                END IF;
                
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1 
                WHERE id = v_inventory_id;
                
                -- We cracked open 1 bottle for this sale
                v_batch_deduction := 1; 
                
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
                
                IF v_new_open_vol > 0 THEN
                   UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
                END IF;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        -- STANDARD PRODUCT
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity
        WHERE id = v_inventory_id;
        
        v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO) --
    -- Use v_batch_deduction instead of v_quantity directly
    v_batch_remaining := v_batch_deduction; -- [FIXED]
    
    -- Only process batches if there is something to deduct
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC, batch_number ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
            
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_alloc,
                is_active_batch = (stock_remaining - v_batch_alloc > 0)
            WHERE id = v_batch.id;
            
            v_batch_remaining := v_batch_remaining - v_batch_alloc;
        END LOOP;
        
        -- ROLLOVER LOGIC
        IF NOT EXISTS (
            SELECT 1 FROM batches 
            WHERE inventory_id = v_inventory_id 
              AND is_active_batch = true 
              AND stock_remaining > 0
        ) THEN
            UPDATE batches
            SET is_active_batch = true
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id 
                  AND stock_remaining > 0
                ORDER BY purchase_date ASC, batch_number ASC
                LIMIT 1
            );
        END IF;
    END IF;

  END LOOP;
  
  -- 5. Create Transaction Record
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- 6. Process Trade-Ins
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NULL THEN NULL; END IF;

      FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
      LOOP
          v_ti_size := v_trade_in->>'size';
          v_ti_condition := v_trade_in->>'condition';
          v_ti_name := v_trade_in->>'name';
          v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
          v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
          v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
          v_ti_product_id := NULL;
          
          IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL AND v_parts_category_id IS NOT NULL THEN
              SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
              IF v_ti_product_id IS NULL THEN
                  SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                  INSERT INTO products (
                      name, category_id, type_id, product_type, description, is_battery, battery_state, cost_price
                  ) VALUES (
                      v_ti_name, v_parts_category_id, v_battery_type_id, 'Battery',
                      'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                      TRUE, LOWER(v_ti_condition), v_ti_cost_price
                  ) RETURNING id INTO v_ti_product_id;
              END IF;
              SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
              SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
              IF v_ti_inventory_id IS NOT NULL THEN
                  UPDATE inventory SET standard_stock = standard_stock + v_ti_quantity, selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
              ELSE
                  INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, v_ti_quantity, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
              END IF;
              INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
              INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
          END IF;
      END LOOP;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Add bottle_size to products and update checkout logic
-- Description: Adds explicit bottle_size column to products to decouple inventory size from sales options.
--              Backfills data based on name and existing volumes.
--              Updates create_checkout_transaction to use this new column.

-- 1. Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'bottle_size') THEN
        ALTER TABLE products ADD COLUMN bottle_size NUMERIC DEFAULT NULL;
    END IF;
END $$;

-- 2. Backfill bottle_size
-- Strategy:
-- A. Try to parse from Name (Most reliable for "Shell ... 4L")
-- B. Fallback to Max Volume from product_volumes
-- C. Default to 4.0 for Lubricants if still null (Business rule)

UPDATE products
SET bottle_size = (
    CASE 
        -- Regex to find "4L", "5L", "1L", "208L" etc in name. 
        -- Matches number followed optionally by space then L/l/Liter/Litre
        WHEN name ~* '(\d+(\.\d+)?)\s*L(iters?|itres?)?\b' THEN 
            substring(name from '(\d+(?:\.\d+)?)\s*L(?:iters?|itres?)?\b')::NUMERIC
        WHEN name ~* '(\d+(\.\d+)?)\s*ml\b' THEN
             substring(name from '(\d+(?:\.\d+)?)\s*ml\b')::NUMERIC / 1000.0
        ELSE NULL
    END
)
WHERE bottle_size IS NULL 
  AND (
      category_id IN (SELECT id FROM categories WHERE name ILIKE 'Lubricants%') 
      OR product_type ILIKE 'lubricant%' 
      OR product_type ILIKE 'oil%'
  );

-- Fallback B: Use Max Volume from product volumes if name parsing failed
UPDATE products p
SET bottle_size = (
    SELECT MAX(
        CASE 
            WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
            WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '^[0-9]+(\.[0-9]+)?')::NUMERIC
            ELSE 0 
        END
    )
    FROM product_volumes pv 
    WHERE pv.product_id = p.id
)
WHERE p.bottle_size IS NULL 
  AND (
      p.category_id IN (SELECT id FROM categories WHERE name ILIKE 'Lubricants%') 
      OR p.product_type ILIKE 'lubricant%' 
      OR p.product_type ILIKE 'oil%'
  );

-- Fallback C: Default to 4.0 for remaining lubricants
UPDATE products
SET bottle_size = 4.0
WHERE bottle_size IS NULL 
  AND (
      category_id IN (SELECT id FROM categories WHERE name ILIKE 'Lubricants%') 
      OR product_type ILIKE 'lubricant%' 
      OR product_type ILIKE 'oil%'
  );

-- 3. Update create_checkout_transaction to use bottle_size
CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB, 
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_product_bottle_size NUMERIC; -- New variable for column value
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_batch_deduction NUMERIC; 
  v_unit_sold_volume NUMERIC;
  v_remainder_per_bottle NUMERIC;

  -- Trade-in variables
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  -- 1. Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Verify location exists
  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- 2. Determine Reference Number Prefix
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        p.is_battery = TRUE OR
        p.product_type ILIKE 'battery' OR 
        p.product_type ILIKE 'batteries' OR
        (c.name = 'Parts' AND (p.product_type ILIKE 'battery' OR p.product_type ILIKE 'batteries')) OR
        p.name ILIKE '%battery%' OR
        p.name ILIKE '%batteries%'
      )
    ) INTO v_is_battery_sale;
    
    IF v_is_battery_sale THEN
      EXIT; 
    END IF;
  END LOOP;

  IF v_is_battery_sale THEN
    v_ref_prefix := 'B';
  ELSE
    CASE UPPER(p_type)
      WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
      WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
      WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
      WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
      ELSE v_ref_prefix := 'A';
    END CASE;
  END IF;

  -- 3. Generate Reference Number
  INSERT INTO reference_number_counters (prefix, counter, updated_at)
  VALUES (v_ref_prefix, 0, NOW())
  ON CONFLICT (prefix) DO UPDATE
  SET counter = reference_number_counters.counter + 1, updated_at = NOW()
  RETURNING counter INTO v_counter;

  IF v_counter = 0 THEN
      UPDATE reference_number_counters
      SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
  END IF;

  v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');

  -- 4. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; 

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type AND Bottle Size
    SELECT 
        (
            (product_type IS NOT NULL AND (product_type ILIKE 'lubricant%' OR product_type ILIKE 'oil%' OR product_type ILIKE 'fluid%')) OR
            EXISTS (SELECT 1 FROM categories c WHERE c.id = category_id AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%'))
        ),
        bottle_size
    INTO v_is_lubricant, v_product_bottle_size
    FROM products 
    WHERE id = v_product_id;

    IF v_is_lubricant THEN
        -- LUBRICANT LOGIC

        -- [NEW]: Resolve Bottle Size Priority: 1. Column, 2. Max Volume, 3. Default
        IF v_product_bottle_size IS NOT NULL AND v_product_bottle_size > 0 THEN
             v_bottle_size := v_product_bottle_size;
        ELSE
            -- Fallback to existing logic if column is null (shouldn't happen with backfill but good safety)
            SELECT MAX(
                CASE 
                    WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                    WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '^[0-9]+(\.[0-9]+)?')::NUMERIC
                    ELSE 0 
                END
            ) INTO v_bottle_size
            FROM product_volumes WHERE product_id = v_product_id;
            
            IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
                 v_bottle_size := 4.0; 
            END IF;
        END IF;

        -- Resolve Unit Volume for ALL lubricant sales
        IF v_volume_desc IS NOT NULL THEN
             v_unit_sold_volume := (
                CASE 
                    WHEN v_volume_desc ~ '^[0-9]+(\.[0-9]+)?$' THEN v_volume_desc::NUMERIC
                    WHEN v_volume_desc ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(v_volume_desc from '^([0-9]+(\.[0-9]+)?)')::NUMERIC
                    ELSE v_bottle_size 
                END
             );
        ELSE
             v_unit_sold_volume := v_bottle_size;
        END IF;
        
        -- SAFEGUARD: Unit sold volume cannot exceed bottle size (e.g. selling 5L from 4L bottle)
        -- Unless it's exactly the same (full bottle)
        -- Note: If unit sold > bottle size, it might be a configuration error, but we'll cap it or warn? 
        -- For now, let's assume valid data from frontend, but just ensure specific check for remainder logic.

        IF v_item_source = 'CLOSED' THEN
            -- v_quantity is BOTTLE COUNT
            
            IF v_closed_bottles < v_quantity THEN
                RAISE EXCEPTION 'No closed bottles available for product % (Requested: %, Available: %)', v_product_id, v_quantity, v_closed_bottles;
            END IF;
            
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - v_quantity::INTEGER
            WHERE id = v_inventory_id;
            
            -- CHECK FOR REMAINDER (Partial Bottle Logic)
            -- Condition: Sold Volume < Bottle Size
            -- Example: Sold 1.0L, Bottle 4.0L -> Remainder 3.0L
            IF v_unit_sold_volume < v_bottle_size THEN
                 v_remainder_per_bottle := v_bottle_size - v_unit_sold_volume;
                 
                  -- Insert N open bottles (where N = v_quantity)
                 INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                 SELECT v_inventory_id, v_bottle_size, v_remainder_per_bottle, FALSE, NOW()
                 FROM generate_series(1, v_quantity::INTEGER);
                 
                 UPDATE inventory 
                 SET open_bottles_stock = open_bottles_stock + v_quantity::INTEGER
                 WHERE id = v_inventory_id;

                 RAISE NOTICE 'Auto-created % open bottle(s) with %L remaining (Size: %L, Sold: %L)', v_quantity, v_remainder_per_bottle, v_bottle_size, v_unit_sold_volume;
            END IF;

            v_batch_deduction := v_quantity;

        ELSIF v_item_source = 'OPEN' THEN
            -- v_quantity is Count of Units * Unit Volume
            
            v_remaining_qty := v_quantity * v_unit_sold_volume;
            
            -- Consume from open bottles (FIFO)
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    
                    if (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
                        UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                    END IF;
                    
                    v_remaining_qty := 0;
                ELSE
                    -- Drain this bottle
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                    
                    UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                END IF;
            END LOOP;
            
            -- Overflow to new closed bottle
            IF v_remaining_qty > 0 THEN
                IF v_closed_bottles < 1 THEN
                    RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
                END IF;
                
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1 
                WHERE id = v_inventory_id;
                
                -- Cracked open 1 bottle
                v_batch_deduction := 1; 
                
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
                
                IF v_new_open_vol > 0 THEN
                   UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
                END IF;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        -- STANDARD PRODUCT
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity
        WHERE id = v_inventory_id;
        
        v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO)
    v_batch_remaining := v_batch_deduction; 
    
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC, batch_number ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
            
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_alloc,
                is_active_batch = (stock_remaining - v_batch_alloc > 0)
            WHERE id = v_batch.id;
            
            v_batch_remaining := v_batch_remaining - v_batch_alloc;
        END LOOP;
        
        -- ROLLOVER
        IF NOT EXISTS (
            SELECT 1 FROM batches 
            WHERE inventory_id = v_inventory_id 
              AND is_active_batch = true 
              AND stock_remaining > 0
        ) THEN
            UPDATE batches
            SET is_active_batch = true
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id 
                  AND stock_remaining > 0
                ORDER BY purchase_date ASC, batch_number ASC
                LIMIT 1
            );
        END IF;
    END IF;

  END LOOP;
  
  -- 5. Create Transaction Record
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- 6. Process Trade-Ins
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      -- (Kept Trade-In logic as is)
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NOT NULL THEN
          FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
          LOOP
              v_ti_size := v_trade_in->>'size';
              v_ti_condition := v_trade_in->>'condition';
              v_ti_name := v_trade_in->>'name';
              v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
              v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
              v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
              v_ti_product_id := NULL;
              
              IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL THEN
                  SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
                  IF v_ti_product_id IS NULL THEN
                      SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                      IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                      INSERT INTO products (
                          name, category_id, type_id, product_type, description, is_battery, battery_state, cost_price
                      ) VALUES (
                          v_ti_name, v_parts_category_id, v_battery_type_id, 'Battery',
                          'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                          TRUE, LOWER(v_ti_condition), v_ti_cost_price
                      ) RETURNING id INTO v_ti_product_id;
                  END IF;
                  SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
                  IF v_ti_inventory_id IS NOT NULL THEN
                      UPDATE inventory SET standard_stock = standard_stock + v_ti_quantity, selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
                  ELSE
                      INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, v_ti_quantity, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
                  END IF;
                  INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
              END IF;
          END LOOP;
      END IF;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Fix Checkout for Non-UUID Products (Labor Charge)
-- Description: Updates create_checkout_transaction to safely handle non-UUID product IDs (like '9999').
--              It skips inventory deduction and battery checks for these items instead of crashing.

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB, -- Array of cart items
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL -- Preserved parameter
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_product_id_text TEXT; -- NEW: For safe parsing
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  
  v_batch_deduction NUMERIC; -- NEW: Track actual batch units to deduct

  -- Trade-in variables
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  -- 1. Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Verify location exists
  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- 2. Determine Reference Number Prefix
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    
    -- [SAFEGUARD]: Check if productId is a valid UUID before casting
    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_product_id := v_product_id_text::UUID;
        
        SELECT EXISTS (
          SELECT 1 FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = v_product_id
          AND (
            p.is_battery = TRUE OR
            p.product_type ILIKE 'battery' OR 
            p.product_type ILIKE 'batteries' OR
            (c.name = 'Parts' AND (p.product_type ILIKE 'battery' OR p.product_type ILIKE 'batteries')) OR
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        
        IF v_is_battery_sale THEN
          EXIT; 
        END IF;
    END IF;
  END LOOP;

  IF v_is_battery_sale THEN
    v_ref_prefix := 'B';
  ELSE
    CASE UPPER(p_type)
      WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
      WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
      WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
      WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
      ELSE v_ref_prefix := 'A';
    END CASE;
  END IF;

  -- 3. Generate Reference Number
  INSERT INTO reference_number_counters (prefix, counter, updated_at)
  VALUES (v_ref_prefix, 0, NOW())
  ON CONFLICT (prefix) DO UPDATE
  SET counter = reference_number_counters.counter + 1, updated_at = NOW()
  RETURNING counter INTO v_counter;

  IF v_counter = 0 THEN
      UPDATE reference_number_counters
      SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
  END IF;

  v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');

  -- 4. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    
    -- [SAFEGUARD]: Skip inventory logic for non-UUID items (Labor Charge, etc.)
    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
        CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; -- Reset

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type - ROBUST LUBRICANT CHECK
    -- Checks product_type AND category for keywords like 'lubricant', 'oil', 'fluid'
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        (p.product_type IS NOT NULL AND (p.product_type ILIKE 'lubricant%' OR p.product_type ILIKE 'oil%' OR p.product_type ILIKE 'fluid%')) OR
        (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%'))
      ) 
    ) INTO v_is_lubricant;

    IF v_is_lubricant THEN
        -- LUBRICANT LOGIC

        -- Resolve Bottle Size
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '^[0-9]+(\.[0-9]+)?')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        IF v_item_source = 'CLOSED' THEN
            -- [FIX]: Treat v_quantity as BOTTLE COUNT
            
            IF v_closed_bottles < v_quantity THEN
                RAISE EXCEPTION 'No closed bottles available for product % (Requested: %, Available: %)', v_product_id, v_quantity, v_closed_bottles;
            END IF;
            
            -- Deduct closed bottles
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - v_quantity::INTEGER
            WHERE id = v_inventory_id;
            
            -- Batch deduction is exactly the quantity (Bottles)
            v_batch_deduction := v_quantity;

        ELSIF v_item_source = 'OPEN' THEN
            -- [FIX]: Treat v_quantity as VOLUME (Liters)
            
            -- Consume from open bottles (FIFO)
            v_remaining_qty := v_quantity;
            
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- This bottle has enough
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    
                    if (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
                        UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                    END IF;
                    
                    v_remaining_qty := 0;
                ELSE
                    -- Drain this bottle
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                    
                    UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                END IF;
            END LOOP;
            
            -- If still need volume, open a new closed bottle (Overflow)
            IF v_remaining_qty > 0 THEN
                IF v_closed_bottles < 1 THEN
                    RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
                END IF;
                
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1 
                WHERE id = v_inventory_id;
                
                -- We cracked open 1 bottle for this sale
                v_batch_deduction := 1; 
                
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
                
                IF v_new_open_vol > 0 THEN
                   UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
                END IF;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        -- STANDARD PRODUCT
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity
        WHERE id = v_inventory_id;
        
        v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO) --
    -- Use v_batch_deduction instead of v_quantity directly
    v_batch_remaining := v_batch_deduction; 
    
    -- Only process batches if there is something to deduct
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC, batch_number ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
            
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_alloc,
                is_active_batch = (stock_remaining - v_batch_alloc > 0)
            WHERE id = v_batch.id;
            
            v_batch_remaining := v_batch_remaining - v_batch_alloc;
        END LOOP;
        
        -- ROLLOVER LOGIC
        IF NOT EXISTS (
            SELECT 1 FROM batches 
            WHERE inventory_id = v_inventory_id 
              AND is_active_batch = true 
              AND stock_remaining > 0
        ) THEN
            UPDATE batches
            SET is_active_batch = true
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id 
                  AND stock_remaining > 0
                ORDER BY purchase_date ASC, batch_number ASC
                LIMIT 1
            );
        END IF;
    END IF;

  END LOOP;
  
  -- 5. Create Transaction Record
  -- NOTE: We insert ALL items (including Labor Charge) into the transaction record
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- 6. Process Trade-Ins (Preserved)
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NULL THEN NULL; END IF;

      FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
      LOOP
          v_ti_size := v_trade_in->>'size';
          v_ti_condition := v_trade_in->>'condition';
          v_ti_name := v_trade_in->>'name';
          v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
          v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
          v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
          v_ti_product_id := NULL;
          
          IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL AND v_parts_category_id IS NOT NULL THEN
              SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
              IF v_ti_product_id IS NULL THEN
                  SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                  INSERT INTO products (
                      name, category_id, type_id, product_type, description, is_battery, battery_state, cost_price
                  ) VALUES (
                      v_ti_name, v_parts_category_id, v_battery_type_id, 'Battery',
                      'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                      TRUE, LOWER(v_ti_condition), v_ti_cost_price
                  ) RETURNING id INTO v_ti_product_id;
              END IF;
              SELECT trade_in_value INTO v_ti_selling_price 
                  FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
              SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
              IF v_ti_inventory_id IS NOT NULL THEN
                  UPDATE inventory SET standard_stock = standard_stock + v_ti_quantity, selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
              ELSE
                  INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, v_ti_quantity, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
              END IF;
              INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
              INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
          END IF;
      END LOOP;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Fix Lubricant Partial Deduction Logic
-- Date: 2026-02-03
-- Description: Updates create_checkout_transaction to correctly handle partial sales of lubricants
-- from closed bottles (creating open bottles) and ensures correct consumption from open bottles.

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB, -- Array of cart items
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_product_id_text TEXT;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  
  -- NEW VARIABLES
  v_sold_volume_per_unit NUMERIC;
  v_total_req_volume NUMERIC;
  v_bottles_to_open INTEGER;
  v_residual_open_volume NUMERIC;
  v_batch_deduction NUMERIC;

  -- Trade-in variables
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  -- 1. Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Verify location exists
  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- 2. Determine Reference Number Prefix
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    
    -- [SAFEGUARD]: Check if productId is a valid UUID
    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_product_id := v_product_id_text::UUID;
        
        SELECT EXISTS (
          SELECT 1 FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = v_product_id
          AND (
            p.is_battery = TRUE OR
            p.product_type ILIKE 'battery' OR 
            p.product_type ILIKE 'batteries' OR
            (c.name = 'Parts' AND (p.product_type ILIKE 'battery' OR p.product_type ILIKE 'batteries')) OR
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        
        IF v_is_battery_sale THEN
          EXIT; 
        END IF;
    END IF;
  END LOOP;

  IF v_is_battery_sale THEN
    v_ref_prefix := 'B';
  ELSE
    CASE UPPER(p_type)
      WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
      WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
      WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
      WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
      ELSE v_ref_prefix := 'A';
    END CASE;
  END IF;

  -- 3. Generate Reference Number
  INSERT INTO reference_number_counters (prefix, counter, updated_at)
  VALUES (v_ref_prefix, 0, NOW())
  ON CONFLICT (prefix) DO UPDATE
  SET counter = reference_number_counters.counter + 1, updated_at = NOW()
  RETURNING counter INTO v_counter;

  IF v_counter = 0 THEN
      UPDATE reference_number_counters
      SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
  END IF;

  v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');

  -- 4. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    
    -- Skip logic for non-UUID items
    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
        CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; 

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type & Name
    SELECT 
        p.name,
        EXISTS (
            SELECT 1 FROM products p2
            LEFT JOIN categories c ON p2.category_id = c.id
            WHERE p2.id = p.id
            AND (
                (p2.product_type IS NOT NULL AND (p2.product_type ILIKE 'lubricant%' OR p2.product_type ILIKE 'oil%' OR p2.product_type ILIKE 'fluid%')) OR
                (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%'))
            ) 
        )
    INTO v_product_name, v_is_lubricant
    FROM products p WHERE p.id = v_product_id;

    IF v_is_lubricant THEN
        -- Resolve Bottle Size (Max Volume)
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '(^[0-9]+(\.[0-9]+)?)')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        -- Resolve Sold Volume Per Unit (The volume of the variant being sold)
        -- Simplified parsing: Extract number from start of string using regex capturing group
        v_sold_volume_per_unit := (substring(v_volume_desc from '(^[0-9]+(\.[0-9]+)?)'))::NUMERIC;

        -- Fallback if parsing failed
        IF v_sold_volume_per_unit IS NULL OR v_sold_volume_per_unit = 0 THEN
             v_sold_volume_per_unit := v_bottle_size;
        END IF;

        -- Calculate TOTAL volume requested (Liters)
        -- This fixes the bug where "2 x 0.5L" was treated as 2L (if source OPEN) or 2 Bottles (if source CLOSED)
        v_total_req_volume := v_sold_volume_per_unit * v_quantity;

        IF v_item_source = 'CLOSED' THEN
            -- Calculate # of bottles needed to cover the volume
            v_bottles_to_open := CEIL(v_total_req_volume / v_bottle_size)::INTEGER;

            IF v_closed_bottles < v_bottles_to_open THEN
                RAISE EXCEPTION 'No closed bottles available for product % (Requested: % bottles, Available: %)', v_product_name, v_bottles_to_open, v_closed_bottles;
            END IF;
            
            -- Deduct closed bottles
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - v_bottles_to_open
            WHERE id = v_inventory_id;
            
            -- Calculate Residual Volume (Did we not fully use the last bottle?)
            v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_total_req_volume;
            
            -- If residual exists, create ONE open bottle with that amount
            IF v_residual_open_volume > 0 THEN
                 INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                 VALUES (v_inventory_id, v_bottle_size, v_residual_open_volume, FALSE, NOW());
                 
                 UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
            END IF;
            
            -- Batch deduction is the count of BOTTLES used
            v_batch_deduction := v_bottles_to_open;

        ELSIF v_item_source = 'OPEN' THEN
            -- Consume from open bottles (FIFO)
            v_remaining_qty := v_total_req_volume; -- Use TOTAL calculated volume
            
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- This bottle has enough
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    
                    if (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
                        UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                    END IF;
                    
                    v_remaining_qty := 0;
                ELSE
                    -- Drain this bottle
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                    
                    UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
                END IF;
            END LOOP;
            
            -- If still need volume, open a new closed bottle (Overflow)
            IF v_remaining_qty > 0 THEN
                IF v_closed_bottles < 1 THEN
                    RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
                END IF;
                
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1 
                WHERE id = v_inventory_id;
                
                -- We cracked open 1 bottle for this sale
                v_batch_deduction := 1; 
                
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
                
                IF v_new_open_vol > 0 THEN
                   UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
                END IF;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        -- STANDARD PRODUCT
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity::INTEGER
        WHERE id = v_inventory_id;
        
        v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO) --
    v_batch_remaining := v_batch_deduction; 
    
    -- Only process batches if there is something to deduct
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC, batch_number ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
            
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_alloc,
                is_active_batch = (stock_remaining - v_batch_alloc > 0)
                WHERE id = v_batch.id;
            
            v_batch_remaining := v_batch_remaining - v_batch_alloc;
        END LOOP;
        
        -- ROLLOVER LOGIC
        IF NOT EXISTS (
            SELECT 1 FROM batches 
            WHERE inventory_id = v_inventory_id 
              AND is_active_batch = true 
              AND stock_remaining > 0
        ) THEN
            UPDATE batches
            SET is_active_batch = true
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id 
                  AND stock_remaining > 0
                ORDER BY purchase_date ASC, batch_number ASC
                LIMIT 1
            );
        END IF;
    END IF;

  END LOOP;
  
  -- 5. Create Transaction Record
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- 6. Process Trade-Ins
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      -- (Kept original logic for trade-ins)
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NOT NULL THEN
          FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
          LOOP
              v_ti_size := v_trade_in->>'size';
              v_ti_condition := v_trade_in->>'condition';
              v_ti_name := v_trade_in->>'name';
              v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
              v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
              v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
              v_ti_product_id := NULL;
              
              IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL THEN
                  SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
                  IF v_ti_product_id IS NULL THEN
                      SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                      IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                      INSERT INTO products (
                          name, category_id, type_id, product_type, description, is_battery, battery_state, cost_price
                      ) VALUES (
                          v_ti_name, v_parts_category_id, v_battery_type_id, 'Battery',
                          'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                          TRUE, LOWER(v_ti_condition), v_ti_cost_price
                      ) RETURNING id INTO v_ti_product_id;
                  END IF;
                  SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
                  IF v_ti_inventory_id IS NOT NULL THEN
                      UPDATE inventory SET standard_stock = standard_stock + v_ti_quantity, selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
                  ELSE
                      INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, v_ti_quantity, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
                  END IF;
                  INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
              END IF;
          END LOOP;
      END IF;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Drop existing function if it exists as we are changing the return type signature
DROP FUNCTION IF EXISTS search_inventory_items_v2(text,uuid,uuid,uuid,numeric,numeric,text,boolean,text,integer,integer);

-- Create search function for inventory (v2 to bypass signature cache/drop issues)
CREATE OR REPLACE FUNCTION search_inventory_items_v2(
  p_search_query TEXT,
  p_location_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_stock_status TEXT DEFAULT 'all',
  p_is_battery BOOLEAN DEFAULT NULL,
  p_battery_state TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  inventory_id UUID,
  product_id UUID,
  standard_stock INTEGER,
  selling_price NUMERIC,
  open_bottles_stock INTEGER,
  closed_bottles_stock INTEGER,
  total_stock INTEGER,
  product_name TEXT,
  product_description TEXT,
  product_image_url TEXT,
  product_low_stock_threshold INTEGER,
  product_cost_price NUMERIC,
  product_manufacturing_date TIMESTAMP WITH TIME ZONE,
  product_is_battery BOOLEAN,
  product_battery_state TEXT,
  product_specification TEXT,
  category_id UUID,
  category_name TEXT,
  brand_id UUID,
  brand_name TEXT,
  search_rank REAL,
  total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_search_tsquery tsquery;
  v_total_count BIGINT;
BEGIN
  -- Prepare search query
  -- Using websearch_to_tsquery for "semantic-lite" feel (handles quotes, minus sign, etc.)
  -- We use 'simple' configuration to avoid overly aggressive stemming which can be confusing for product codes
  v_search_tsquery := websearch_to_tsquery('simple', unaccent(p_search_query));

  -- Get total count for pagination
  SELECT COUNT(*) INTO v_total_count
  FROM inventory i
  JOIN products p ON i.product_id = p.id
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
  WHERE i.location_id = p_location_id
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
    AND (p_min_price IS NULL OR i.selling_price >= p_min_price)
    AND (p_max_price IS NULL OR i.selling_price <= p_max_price)
    AND (
      p_stock_status = 'all' OR
      (p_stock_status = 'in-stock' AND i.standard_stock > COALESCE(p.low_stock_threshold, 10)) OR
      (p_stock_status = 'low-stock' AND i.standard_stock > 0 AND i.standard_stock <= COALESCE(p.low_stock_threshold, 10)) OR
      (p_stock_status = 'out-of-stock' AND i.standard_stock = 0)
    )
    AND (p_is_battery IS NULL OR p.is_battery = p_is_battery)
    AND (p_battery_state IS NULL OR p.battery_state = p_battery_state)
    AND (
      p_search_query = '' OR
      to_tsvector('simple', unaccent(p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(b.name, '') || ' ' || COALESCE(c.name, '') || ' ' || COALESCE(p.specification, ''))) @@ v_search_tsquery OR
      unaccent(p.name) % unaccent(p_search_query) OR
      unaccent(COALESCE(b.name, '')) % unaccent(p_search_query)
    );

  RETURN QUERY
  SELECT 
    i.id as inventory_id,
    p.id as product_id,
    i.standard_stock,
    i.selling_price,
    i.open_bottles_stock,
    i.closed_bottles_stock,
    i.total_stock,
    p.name as product_name,
    p.description as product_description,
    p.image_url as product_image_url,
    p.low_stock_threshold as product_low_stock_threshold,
    p.cost_price as product_cost_price,
    p.manufacturing_date as product_manufacturing_date,
    p.is_battery as product_is_battery,
    p.battery_state as product_battery_state,
    p.specification as product_specification,
    c.id as category_id,
    c.name as category_name,
    b.id as brand_id,
    b.name as brand_name,
    (
      -- Calculate search rank
      ts_rank_cd(
        to_tsvector('simple', unaccent(p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(b.name, '') || ' ' || COALESCE(c.name, '') || ' ' || COALESCE(p.specification, ''))),
        v_search_tsquery
      ) + 
      similarity(unaccent(p.name), unaccent(p_search_query)) * 0.5 +
      similarity(unaccent(COALESCE(b.name, '')), unaccent(p_search_query)) * 0.3
    )::REAL as search_rank,
    v_total_count as total_count
  FROM inventory i
  JOIN products p ON i.product_id = p.id
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
  WHERE i.location_id = p_location_id
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
    AND (p_min_price IS NULL OR i.selling_price >= p_min_price)
    AND (p_max_price IS NULL OR i.selling_price <= p_max_price)
    AND (
      p_stock_status = 'all' OR
      (p_stock_status = 'in-stock' AND i.standard_stock > COALESCE(p.low_stock_threshold, 10)) OR
      (p_stock_status = 'low-stock' AND i.standard_stock > 0 AND i.standard_stock <= COALESCE(p.low_stock_threshold, 10)) OR
      (p_stock_status = 'out-of-stock' AND i.standard_stock = 0)
    )
    AND (p_is_battery IS NULL OR p.is_battery = p_is_battery)
    AND (p_battery_state IS NULL OR p.battery_state = p_battery_state)
    AND (
      p_search_query = '' OR
      to_tsvector('simple', unaccent(p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(b.name, '') || ' ' || COALESCE(c.name, '') || ' ' || COALESCE(p.specification, ''))) @@ v_search_tsquery OR
      unaccent(p.name) % unaccent(p_search_query) OR
      unaccent(COALESCE(b.name, '')) % unaccent(p_search_query)
    )
  ORDER BY 
    CASE WHEN p_search_query = '' THEN i.id::text ELSE '' END ASC,
    search_rank DESC,
    p.name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Migration: Fix Lubricant Negative Stock & Sync Inventory from Batches
-- Date: 2026-03-15
-- Description: Adds triggers to automatically keep inventory in sync with batches and open_bottle_details, fixes create_checkout_transaction to rely on triggers for inventory updates and support overselling.

-- 1. Sync Existing Data
-- Backfill open_bottles_stock
UPDATE inventory i
SET open_bottles_stock = (
  SELECT COUNT(*)
  FROM open_bottle_details obd
  WHERE obd.inventory_id = i.id AND obd.is_empty = FALSE
)
WHERE EXISTS (
  SELECT 1 FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.id = i.product_id
  AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
);

-- Backfill closed_bottles_stock
UPDATE inventory i
SET closed_bottles_stock = COALESCE((
  SELECT SUM(stock_remaining)
  FROM batches b
  WHERE b.inventory_id = i.id
), 0)
WHERE EXISTS (
  SELECT 1 FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.id = i.product_id
  AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
);

-- Backfill standard_stock
UPDATE inventory i
SET standard_stock = COALESCE((
  SELECT SUM(stock_remaining)
  FROM batches b
  WHERE b.inventory_id = i.id
), 0)
WHERE NOT EXISTS (
  SELECT 1 FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.id = i.product_id
  AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
);

-- 2. Create Triggers
CREATE OR REPLACE FUNCTION sync_inventory_from_batches()
RETURNS TRIGGER AS $$
DECLARE
  v_is_lubricant BOOLEAN;
  v_total_batch_stock INTEGER;
  v_inv_id UUID;
BEGIN
  v_inv_id := COALESCE(NEW.inventory_id, OLD.inventory_id);

  SELECT EXISTS (
    SELECT 1 FROM products p
    JOIN inventory i ON i.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE i.id = v_inv_id
    AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
  ) INTO v_is_lubricant;

  SELECT COALESCE(SUM(stock_remaining), 0)
  INTO v_total_batch_stock
  FROM batches
  WHERE inventory_id = v_inv_id;

  IF v_is_lubricant THEN
    UPDATE inventory
    SET closed_bottles_stock = v_total_batch_stock
    WHERE id = v_inv_id;
  ELSE
    UPDATE inventory
    SET standard_stock = v_total_batch_stock
    WHERE id = v_inv_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sync_inventory_from_batches
AFTER INSERT OR UPDATE OF stock_remaining OR DELETE ON batches
FOR EACH ROW
EXECUTE FUNCTION sync_inventory_from_batches();

CREATE OR REPLACE FUNCTION sync_inventory_from_open_bottles()
RETURNS TRIGGER AS $$
DECLARE
  v_open_bottles INTEGER;
  v_inv_id UUID;
BEGIN
  v_inv_id := COALESCE(NEW.inventory_id, OLD.inventory_id);

  SELECT COUNT(*)
  INTO v_open_bottles
  FROM open_bottle_details
  WHERE inventory_id = v_inv_id
  AND is_empty = FALSE;

  UPDATE inventory
  SET open_bottles_stock = v_open_bottles
  WHERE id = v_inv_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sync_inventory_from_open_bottles
AFTER INSERT OR UPDATE OF is_empty OR DELETE ON open_bottle_details
FOR EACH ROW
EXECUTE FUNCTION sync_inventory_from_open_bottles();

-- 3. Modify create_checkout_transaction RPC
CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_product_id_text TEXT;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_sold_volume_per_unit NUMERIC;
  v_total_req_volume NUMERIC;
  v_bottles_to_open INTEGER;
  v_residual_open_volume NUMERIC;
  v_batch_deduction NUMERIC;
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_product_id := v_product_id_text::UUID;
        SELECT EXISTS (
          SELECT 1 FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = v_product_id
          AND (
            p.is_battery = TRUE OR
            (c.name = 'Parts' AND (p.name ILIKE '%battery%' OR p.name ILIKE '%batteries%')) OR
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        
        IF v_is_battery_sale THEN
          EXIT; 
        END IF;
    END IF;
  END LOOP;

  IF v_is_battery_sale THEN
    v_ref_prefix := 'B';
  ELSE
    CASE UPPER(p_type)
      WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
      WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
      WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
      WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
      ELSE v_ref_prefix := 'A';
    END CASE;
  END IF;

  INSERT INTO reference_number_counters (prefix, counter, updated_at)
  VALUES (v_ref_prefix, 0, NOW())
  ON CONFLICT (prefix) DO UPDATE
  SET counter = reference_number_counters.counter + 1, updated_at = NOW()
  RETURNING counter INTO v_counter;

  IF v_counter = 0 THEN
      UPDATE reference_number_counters
      SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
  END IF;

  v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
        CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; 

    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    SELECT 
        p.name,
        EXISTS (
            SELECT 1 FROM products p2
            LEFT JOIN categories c ON p2.category_id = c.id
            WHERE p2.id = p.id
            AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
        )
    INTO v_product_name, v_is_lubricant
    FROM products p WHERE p.id = v_product_id;

    IF v_is_lubricant THEN
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '(^[0-9]+(\.[0-9]+)?)')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        v_sold_volume_per_unit := (substring(v_volume_desc from '(^[0-9]+(\.[0-9]+)?)'))::NUMERIC;
        IF v_sold_volume_per_unit IS NULL OR v_sold_volume_per_unit = 0 THEN
             v_sold_volume_per_unit := v_bottle_size;
        END IF;

        v_total_req_volume := v_sold_volume_per_unit * v_quantity;

        IF v_item_source = 'CLOSED' THEN
            v_bottles_to_open := CEIL(v_total_req_volume / v_bottle_size)::INTEGER;
            
            v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_total_req_volume;
            IF v_residual_open_volume > 0 THEN
                 INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                 VALUES (v_inventory_id, v_bottle_size, v_residual_open_volume, FALSE, NOW());
            END IF;
            
            v_batch_deduction := v_bottles_to_open;

        ELSIF v_item_source = 'OPEN' THEN
            v_remaining_qty := v_total_req_volume; 
            
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    v_remaining_qty := 0;
                ELSE
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                END IF;
            END LOOP;
            
            IF v_remaining_qty > 0 THEN
                v_batch_deduction := 1; 
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO) --
    v_batch_remaining := v_batch_deduction; 
    
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC, batch_number ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            IF v_batch.stock_remaining > 0 THEN
                v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
                UPDATE batches
                SET stock_remaining = stock_remaining - v_batch_alloc,
                    is_active_batch = (stock_remaining - v_batch_alloc > 0)
                    WHERE id = v_batch.id;
                v_batch_remaining := v_batch_remaining - v_batch_alloc;
            END IF;
        END LOOP;
        
        IF v_batch_remaining > 0 THEN
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_remaining,
                is_active_batch = TRUE
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id
                ORDER BY purchase_date DESC, batch_number DESC
                LIMIT 1
            );
            
            IF NOT FOUND THEN
                INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, is_active_batch, batch_number)
                VALUES (v_inventory_id, 0, -v_batch_remaining, 0, TRUE, 1);
            END IF;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM batches 
            WHERE inventory_id = v_inventory_id 
              AND is_active_batch = true 
              AND stock_remaining > 0
        ) THEN
            UPDATE batches
            SET is_active_batch = true
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id 
                  AND stock_remaining > 0
                ORDER BY purchase_date ASC, batch_number ASC
                LIMIT 1
            );
        END IF;
    END IF;

  END LOOP;
  
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NOT NULL THEN
          FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
          LOOP
              v_ti_size := v_trade_in->>'size';
              v_ti_condition := v_trade_in->>'condition';
              v_ti_name := v_trade_in->>'name';
              v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
              v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
              v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
              v_ti_product_id := NULL;
              
              IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL THEN
                  SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
                  IF v_ti_product_id IS NULL THEN
                      SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                      IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                      INSERT INTO products (
                          name, category_id, type_id, description, is_battery, battery_state, cost_price
                      ) VALUES (
                          v_ti_name, v_parts_category_id, v_battery_type_id, 
                          'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                          TRUE, LOWER(v_ti_condition), v_ti_cost_price
                      ) RETURNING id INTO v_ti_product_id;
                  END IF;
                  SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
                  IF v_ti_inventory_id IS NOT NULL THEN
                      UPDATE inventory SET selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  ELSE
                      INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, 0, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  END IF;
                  
                  INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
              END IF;
          END LOOP;
      END IF;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Fix Standard Stock Not Updating for Lubricants
-- Description: Ensures standard_stock is also decremented/synced for lubricants, so legacy UI components or fallback logic reading standard_stock will see the correct updated values.

-- 1. Correct existing standard_stock for lubricants to match closed_bottles_stock
UPDATE inventory i
SET standard_stock = closed_bottles_stock
WHERE EXISTS (
  SELECT 1 FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.id = i.product_id
  AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
);

-- 2. Update the sync_inventory_from_batches trigger function
CREATE OR REPLACE FUNCTION sync_inventory_from_batches()
RETURNS TRIGGER AS $$
DECLARE
  v_is_lubricant BOOLEAN;
  v_total_batch_stock INTEGER;
  v_inv_id UUID;
BEGIN
  v_inv_id := COALESCE(NEW.inventory_id, OLD.inventory_id);

  SELECT EXISTS (
    SELECT 1 FROM products p
    JOIN inventory i ON i.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE i.id = v_inv_id
    AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
  ) INTO v_is_lubricant;

  SELECT COALESCE(SUM(stock_remaining), 0)
  INTO v_total_batch_stock
  FROM batches
  WHERE inventory_id = v_inv_id;

  IF v_is_lubricant THEN
    UPDATE inventory
    SET closed_bottles_stock = v_total_batch_stock,
        standard_stock = v_total_batch_stock -- KEEP STANDARD STOCK IN SYNC FOR FALLBACKS
    WHERE id = v_inv_id;
  ELSE
    UPDATE inventory
    SET standard_stock = v_total_batch_stock
    WHERE id = v_inv_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Modify create_checkout_transaction RPC
CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_product_id_text TEXT;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_sold_volume_per_unit NUMERIC;
  v_total_req_volume NUMERIC;
  v_bottles_to_open INTEGER;
  v_residual_open_volume NUMERIC;
  v_batch_deduction NUMERIC;
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_product_id := v_product_id_text::UUID;
        SELECT EXISTS (
          SELECT 1 FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = v_product_id
          AND (
            p.is_battery = TRUE OR
            (c.name = 'Parts' AND (p.name ILIKE '%battery%' OR p.name ILIKE '%batteries%')) OR
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        
        IF v_is_battery_sale THEN
          EXIT; 
        END IF;
    END IF;
  END LOOP;

  IF p_reference_number IS NOT NULL AND p_reference_number != '' THEN
    v_reference_number := p_reference_number;
  ELSE
    IF v_is_battery_sale THEN
      v_ref_prefix := 'B';
    ELSE
      CASE UPPER(p_type)
        WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
        WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
        WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
        WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
        ELSE v_ref_prefix := 'A';
      END CASE;
    END IF;

    INSERT INTO reference_number_counters (prefix, counter, updated_at)
    VALUES (v_ref_prefix, 0, NOW())
    ON CONFLICT (prefix) DO UPDATE
    SET counter = reference_number_counters.counter + 1, updated_at = NOW()
    RETURNING counter INTO v_counter;

    IF v_counter = 0 THEN
        UPDATE reference_number_counters
        SET counter = 1, updated_at = NOW()
        WHERE prefix = v_ref_prefix AND counter = 0
        RETURNING counter INTO v_counter;
    END IF;

    v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
        CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; 

    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    SELECT 
        p.name,
        EXISTS (
            SELECT 1 FROM products p2
            LEFT JOIN categories c ON p2.category_id = c.id
            WHERE p2.id = p.id
            AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
        )
    INTO v_product_name, v_is_lubricant
    FROM products p WHERE p.id = v_product_id;

    IF v_is_lubricant THEN
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '(^[0-9]+(\.[0-9]+)?)')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        v_sold_volume_per_unit := (substring(v_volume_desc from '(^[0-9]+(\.[0-9]+)?)'))::NUMERIC;
        IF v_sold_volume_per_unit IS NULL OR v_sold_volume_per_unit = 0 THEN
             v_sold_volume_per_unit := v_bottle_size;
        END IF;

        v_total_req_volume := v_sold_volume_per_unit * v_quantity;

        IF v_item_source = 'CLOSED' THEN
            v_bottles_to_open := CEIL(v_total_req_volume / v_bottle_size)::INTEGER;
            
            v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_total_req_volume;
            IF v_residual_open_volume > 0 THEN
                 INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                 VALUES (v_inventory_id, v_bottle_size, v_residual_open_volume, FALSE, NOW());
            END IF;
            
            v_batch_deduction := v_bottles_to_open;

            -- KEEP STANDARD STOCK IN SYNC FOR FALLBACKS
            UPDATE inventory 
            SET closed_bottles_stock = closed_bottles_stock - v_bottles_to_open,
                standard_stock = standard_stock - v_bottles_to_open
            WHERE id = v_inventory_id;
            
        ELSIF v_item_source = 'OPEN' THEN
            v_remaining_qty := v_total_req_volume; 
            
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    v_remaining_qty := 0;
                ELSE
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                END IF;
            END LOOP;
            
            IF v_remaining_qty > 0 THEN
                v_batch_deduction := 1; 
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
                
                -- IF A NEW BOTTLE WAS OPENED, WE MUST REDUCE THE CLOSED BOTTLES STOCK (AND STANDARD STOCK)
                UPDATE inventory 
                SET closed_bottles_stock = closed_bottles_stock - 1,
                    standard_stock = standard_stock - 1
                WHERE id = v_inventory_id;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        v_batch_deduction := v_quantity;
        
        UPDATE inventory 
        SET standard_stock = standard_stock - v_quantity
        WHERE id = v_inventory_id;
    END IF;

    -- BATCH ALLOCATION (FIFO) --
    v_batch_remaining := v_batch_deduction; 
    
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC, batch_number ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            IF v_batch.stock_remaining > 0 THEN
                v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
                UPDATE batches
                SET stock_remaining = stock_remaining - v_batch_alloc,
                    is_active_batch = (stock_remaining - v_batch_alloc > 0)
                    WHERE id = v_batch.id;
                v_batch_remaining := v_batch_remaining - v_batch_alloc;
            END IF;
        END LOOP;
        
        IF v_batch_remaining > 0 THEN
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_remaining,
                is_active_batch = TRUE
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id
                ORDER BY purchase_date DESC, batch_number DESC
                LIMIT 1
            );
            
            IF NOT FOUND THEN
                INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, is_active_batch, batch_number)
                VALUES (v_inventory_id, 0, -v_batch_remaining, 0, TRUE, 1);
            END IF;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM batches 
            WHERE inventory_id = v_inventory_id 
              AND is_active_batch = true 
              AND stock_remaining > 0
        ) THEN
            UPDATE batches
            SET is_active_batch = true
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id 
                  AND stock_remaining > 0
                ORDER BY purchase_date ASC, batch_number ASC
                LIMIT 1
            );
        END IF;
    END IF;

  END LOOP;
  
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NOT NULL THEN
          FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
          LOOP
              v_ti_size := v_trade_in->>'size';
              v_ti_condition := v_trade_in->>'condition';
              v_ti_name := v_trade_in->>'name';
              v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
              v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
              v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
              v_ti_product_id := NULL;
              
              IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL THEN
                  SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
                  IF v_ti_product_id IS NULL THEN
                      SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                      IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                      INSERT INTO products (
                          name, category_id, type_id, description, is_battery, battery_state, cost_price
                      ) VALUES (
                          v_ti_name, v_parts_category_id, v_battery_type_id, 
                          'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                          TRUE, LOWER(v_ti_condition), v_ti_cost_price
                      ) RETURNING id INTO v_ti_product_id;
                  END IF;
                  SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
                  IF v_ti_inventory_id IS NOT NULL THEN
                      UPDATE inventory SET selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  ELSE
                      INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, 0, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  END IF;
                  
                  INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
              END IF;
          END LOOP;
      END IF;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Fix Standard Stock Sum
-- Description: Ensures standard_stock equals closed_bottles_stock + open_bottles_stock for lubricants.

-- 1. Create a unified trigger function
CREATE OR REPLACE FUNCTION sync_inventory_from_batches_and_open_bottles()
RETURNS TRIGGER AS $$
DECLARE
  v_is_lubricant BOOLEAN;
  v_total_batch_stock INTEGER;
  v_open_bottles INTEGER;
  v_inv_id UUID;
BEGIN
  v_inv_id := COALESCE(NEW.inventory_id, OLD.inventory_id);

  SELECT EXISTS (
    SELECT 1 FROM products p
    JOIN inventory i ON i.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE i.id = v_inv_id
    AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
  ) INTO v_is_lubricant;

  -- Always calculate batches stock
  SELECT COALESCE(SUM(stock_remaining), 0)
  INTO v_total_batch_stock
  FROM batches
  WHERE inventory_id = v_inv_id;

  IF v_is_lubricant THEN
    -- Calculate open bottles
    SELECT COUNT(*)
    INTO v_open_bottles
    FROM open_bottle_details
    WHERE inventory_id = v_inv_id
    AND is_empty = FALSE;

    UPDATE inventory
    SET closed_bottles_stock = v_total_batch_stock,
        open_bottles_stock = v_open_bottles,
        standard_stock = v_total_batch_stock + v_open_bottles
    WHERE id = v_inv_id;
  ELSE
    UPDATE inventory
    SET standard_stock = v_total_batch_stock
    WHERE id = v_inv_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sync_inventory_from_batches
AFTER INSERT OR UPDATE OF stock_remaining OR DELETE ON batches
FOR EACH ROW
EXECUTE FUNCTION sync_inventory_from_batches_and_open_bottles();

CREATE TRIGGER tr_sync_inventory_from_open_bottles
AFTER INSERT OR UPDATE OF is_empty OR DELETE ON open_bottle_details
FOR EACH ROW
EXECUTE FUNCTION sync_inventory_from_batches_and_open_bottles();

-- 3. Update existing inventory standard_stock data
UPDATE inventory i
SET standard_stock = COALESCE(closed_bottles_stock, 0) + COALESCE(open_bottles_stock, 0)
WHERE EXISTS (
  SELECT 1 FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.id = i.product_id
  AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
);

-- 4. Clean up create_checkout_transaction by removing redundant UPDATE inventory queries
CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_product_id_text TEXT;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_sold_volume_per_unit NUMERIC;
  v_total_req_volume NUMERIC;
  v_bottles_to_open INTEGER;
  v_residual_open_volume NUMERIC;
  v_batch_deduction NUMERIC;
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_product_id := v_product_id_text::UUID;
        SELECT EXISTS (
          SELECT 1 FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = v_product_id
          AND (
            p.is_battery = TRUE OR
            (c.name = 'Parts' AND (p.name ILIKE '%battery%' OR p.name ILIKE '%batteries%')) OR
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        
        IF v_is_battery_sale THEN
          EXIT; 
        END IF;
    END IF;
  END LOOP;

  IF p_reference_number IS NOT NULL AND p_reference_number != '' THEN
    v_reference_number := p_reference_number;
  ELSE
    IF v_is_battery_sale THEN
      v_ref_prefix := 'B';
    ELSE
      CASE UPPER(p_type)
        WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
        WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
        WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
        WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
        ELSE v_ref_prefix := 'A';
      END CASE;
    END IF;

    INSERT INTO reference_number_counters (prefix, counter, updated_at)
    VALUES (v_ref_prefix, 0, NOW())
    ON CONFLICT (prefix) DO UPDATE
    SET counter = reference_number_counters.counter + 1, updated_at = NOW()
    RETURNING counter INTO v_counter;

    IF v_counter = 0 THEN
        UPDATE reference_number_counters
        SET counter = 1, updated_at = NOW()
        WHERE prefix = v_ref_prefix AND counter = 0
        RETURNING counter INTO v_counter;
    END IF;

    v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
        CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; 

    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    SELECT 
        p.name,
        EXISTS (
            SELECT 1 FROM products p2
            LEFT JOIN categories c ON p2.category_id = c.id
            WHERE p2.id = p.id
            AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
        )
    INTO v_product_name, v_is_lubricant
    FROM products p WHERE p.id = v_product_id;

    IF v_is_lubricant THEN
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '(^[0-9]+(\.[0-9]+)?)')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        v_sold_volume_per_unit := (substring(v_volume_desc from '(^[0-9]+(\.[0-9]+)?)'))::NUMERIC;
        IF v_sold_volume_per_unit IS NULL OR v_sold_volume_per_unit = 0 THEN
             v_sold_volume_per_unit := v_bottle_size;
        END IF;

        v_total_req_volume := v_sold_volume_per_unit * v_quantity;

        IF v_item_source = 'CLOSED' THEN
            v_bottles_to_open := CEIL(v_total_req_volume / v_bottle_size)::INTEGER;
            
            v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_total_req_volume;
            IF v_residual_open_volume > 0 THEN
                 -- This insertion fires the trigger to increment open bottles
                 INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                 VALUES (v_inventory_id, v_bottle_size, v_residual_open_volume, FALSE, NOW());
            END IF;
            
            v_batch_deduction := v_bottles_to_open;
            
        ELSIF v_item_source = 'OPEN' THEN
            v_remaining_qty := v_total_req_volume; 
            
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- These updates fire the trigger to decrement open bottles (if emptied)
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    v_remaining_qty := 0;
                ELSE
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                END IF;
            END LOOP;
            
            IF v_remaining_qty > 0 THEN
                v_batch_deduction := 1; 
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                -- This insertion fires the trigger to increment open bottles over writing any empties
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO) --
    v_batch_remaining := v_batch_deduction; 
    
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC, batch_number ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            IF v_batch.stock_remaining > 0 THEN
                v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
                -- This update fires the trigger to update batches sum and standard stock
                UPDATE batches
                SET stock_remaining = stock_remaining - v_batch_alloc,
                    is_active_batch = (stock_remaining - v_batch_alloc > 0)
                    WHERE id = v_batch.id;
                v_batch_remaining := v_batch_remaining - v_batch_alloc;
            END IF;
        END LOOP;
        
        IF v_batch_remaining > 0 THEN
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_remaining,
                is_active_batch = TRUE
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id
                ORDER BY purchase_date DESC, batch_number DESC
                LIMIT 1
            );
            
            IF NOT FOUND THEN
                INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, is_active_batch, batch_number)
                VALUES (v_inventory_id, 0, -v_batch_remaining, 0, TRUE, 1);
            END IF;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM batches 
            WHERE inventory_id = v_inventory_id 
              AND is_active_batch = true 
              AND stock_remaining > 0
        ) THEN
            UPDATE batches
            SET is_active_batch = true
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id 
                  AND stock_remaining > 0
                ORDER BY purchase_date ASC, batch_number ASC
                LIMIT 1
            );
        END IF;
    END IF;

  END LOOP;
  
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NOT NULL THEN
          FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
          LOOP
              v_ti_size := v_trade_in->>'size';
              v_ti_condition := v_trade_in->>'condition';
              v_ti_name := v_trade_in->>'name';
              v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
              v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
              v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
              v_ti_product_id := NULL;
              
              IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL THEN
                  SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
                  IF v_ti_product_id IS NULL THEN
                      SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                      IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                      INSERT INTO products (
                          name, category_id, type_id, description, is_battery, battery_state, cost_price
                      ) VALUES (
                          v_ti_name, v_parts_category_id, v_battery_type_id, 
                          'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                          TRUE, LOWER(v_ti_condition), v_ti_cost_price
                      ) RETURNING id INTO v_ti_product_id;
                  END IF;
                  SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
                  IF v_ti_inventory_id IS NOT NULL THEN
                      UPDATE inventory SET selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  ELSE
                      INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, 0, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  END IF;
                  
                  INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
              END IF;
          END LOOP;
      END IF;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Sync inventory.open_bottles_stock from open_bottle_details
-- Problem: inventory.open_bottles_stock can drift and show 0 while the UI correctly
--          derives open bottles from open_bottle_details (is_empty = false).
-- Fix: Maintain inventory.open_bottles_stock as a cached count of non-empty open bottles.

-- 1) Backfill existing rows
UPDATE public.inventory i
SET open_bottles_stock = COALESCE(ob.open_count, 0)
FROM (
  SELECT inventory_id, COUNT(*)::INTEGER AS open_count
  FROM public.open_bottle_details
  WHERE is_empty = FALSE
  GROUP BY inventory_id
) ob
WHERE i.id = ob.inventory_id;

-- Ensure inventories with no open bottles are set to 0
UPDATE public.inventory
SET open_bottles_stock = 0
WHERE open_bottles_stock IS NULL;

-- 2) Trigger function to sync the cached count
CREATE OR REPLACE FUNCTION public.sync_inventory_open_bottles_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_new_inv_id UUID;
  v_old_inv_id UUID;
BEGIN
  v_new_inv_id := COALESCE(NEW.inventory_id, NULL);
  v_old_inv_id := COALESCE(OLD.inventory_id, NULL);

  -- Recalculate for NEW.inventory_id when present (INSERT/UPDATE)
  IF v_new_inv_id IS NOT NULL THEN
    UPDATE public.inventory
    SET open_bottles_stock = (
      SELECT COUNT(*)::INTEGER
      FROM public.open_bottle_details
      WHERE inventory_id = v_new_inv_id
        AND is_empty = FALSE
    )
    WHERE id = v_new_inv_id;
  END IF;

  -- If inventory_id changed (or DELETE), recalc the OLD one too
  IF v_old_inv_id IS NOT NULL AND v_old_inv_id IS DISTINCT FROM v_new_inv_id THEN
    UPDATE public.inventory
    SET open_bottles_stock = (
      SELECT COUNT(*)::INTEGER
      FROM public.open_bottle_details
      WHERE inventory_id = v_old_inv_id
        AND is_empty = FALSE
    )
    WHERE id = v_old_inv_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_inventory_open_bottles_stock
AFTER INSERT OR UPDATE OR DELETE ON public.open_bottle_details
FOR EACH ROW
EXECUTE FUNCTION public.sync_inventory_open_bottles_stock();

-- Checkout: consume open lubricant stock from bottles with the least liquid REMAINING first
-- (current_volume ASC), then oldest opened_at. This finishes partial bottles (e.g. 1L left in a
-- 4L jug) before taking from another bottle. Ordering by initial_volume alone would prefer a
-- full 1L SKU over a 4L bottle’s last 1L, which is wrong for “lowest volume first” in practice.

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_product_id_text TEXT;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_sold_volume_per_unit NUMERIC;
  v_total_req_volume NUMERIC;
  v_bottles_to_open INTEGER;
  v_residual_open_volume NUMERIC;
  v_batch_deduction NUMERIC;
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_product_id := v_product_id_text::UUID;
        SELECT EXISTS (
          SELECT 1 FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = v_product_id
          AND (
            p.is_battery = TRUE OR
            (c.name = 'Parts' AND (p.name ILIKE '%battery%' OR p.name ILIKE '%batteries%')) OR
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        
        IF v_is_battery_sale THEN
          EXIT; 
        END IF;
    END IF;
  END LOOP;

  IF p_reference_number IS NOT NULL AND p_reference_number != '' THEN
    v_reference_number := p_reference_number;
  ELSE
    IF v_is_battery_sale THEN
      v_ref_prefix := 'B';
    ELSE
      CASE UPPER(p_type)
        WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
        WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
        WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
        WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
        ELSE v_ref_prefix := 'A';
      END CASE;
    END IF;

    INSERT INTO reference_number_counters (prefix, counter, updated_at)
    VALUES (v_ref_prefix, 0, NOW())
    ON CONFLICT (prefix) DO UPDATE
    SET counter = reference_number_counters.counter + 1, updated_at = NOW()
    RETURNING counter INTO v_counter;

    IF v_counter = 0 THEN
        UPDATE reference_number_counters
        SET counter = 1, updated_at = NOW()
        WHERE prefix = v_ref_prefix AND counter = 0
        RETURNING counter INTO v_counter;
    END IF;

    v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
        CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; 

    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    SELECT 
        p.name,
        EXISTS (
            SELECT 1 FROM products p2
            LEFT JOIN categories c ON p2.category_id = c.id
            WHERE p2.id = p.id
            AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
        )
    INTO v_product_name, v_is_lubricant
    FROM products p WHERE p.id = v_product_id;

    IF v_is_lubricant THEN
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '(^[0-9]+(\.[0-9]+)?)')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        v_sold_volume_per_unit := (substring(v_volume_desc from '(^[0-9]+(\.[0-9]+)?)'))::NUMERIC;
        IF v_sold_volume_per_unit IS NULL OR v_sold_volume_per_unit = 0 THEN
             v_sold_volume_per_unit := v_bottle_size;
        END IF;

        v_total_req_volume := v_sold_volume_per_unit * v_quantity;

        IF v_item_source = 'CLOSED' THEN
            v_bottles_to_open := CEIL(v_total_req_volume / v_bottle_size)::INTEGER;
            
            v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_total_req_volume;
            IF v_residual_open_volume > 0 THEN
                 -- This insertion fires the trigger to increment open bottles
                 INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                 VALUES (v_inventory_id, v_bottle_size, v_residual_open_volume, FALSE, NOW());
            END IF;
            
            v_batch_deduction := v_bottles_to_open;
            
        ELSIF v_item_source = 'OPEN' THEN
            v_remaining_qty := v_total_req_volume; 
            
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY current_volume ASC NULLS LAST, opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- These updates fire the trigger to decrement open bottles (if emptied)
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    v_remaining_qty := 0;
                ELSE
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                END IF;
            END LOOP;
            
            IF v_remaining_qty > 0 THEN
                v_batch_deduction := 1; 
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                -- This insertion fires the trigger to increment open bottles over writing any empties
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO) --
    v_batch_remaining := v_batch_deduction; 
    
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC, batch_number ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            IF v_batch.stock_remaining > 0 THEN
                v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
                -- This update fires the trigger to update batches sum and standard stock
                UPDATE batches
                SET stock_remaining = stock_remaining - v_batch_alloc,
                    is_active_batch = (stock_remaining - v_batch_alloc > 0)
                    WHERE id = v_batch.id;
                v_batch_remaining := v_batch_remaining - v_batch_alloc;
            END IF;
        END LOOP;
        
        IF v_batch_remaining > 0 THEN
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_remaining,
                is_active_batch = TRUE
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id
                ORDER BY purchase_date DESC, batch_number DESC
                LIMIT 1
            );
            
            IF NOT FOUND THEN
                INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, is_active_batch, batch_number)
                VALUES (v_inventory_id, 0, -v_batch_remaining, 0, TRUE, 1);
            END IF;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM batches 
            WHERE inventory_id = v_inventory_id 
              AND is_active_batch = true 
              AND stock_remaining > 0
        ) THEN
            UPDATE batches
            SET is_active_batch = true
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id 
                  AND stock_remaining > 0
                ORDER BY purchase_date ASC, batch_number ASC
                LIMIT 1
            );
        END IF;
    END IF;

  END LOOP;
  
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NOT NULL THEN
          FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
          LOOP
              v_ti_size := v_trade_in->>'size';
              v_ti_condition := v_trade_in->>'condition';
              v_ti_name := v_trade_in->>'name';
              v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
              v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
              v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
              v_ti_product_id := NULL;
              
              IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL THEN
                  SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
                  IF v_ti_product_id IS NULL THEN
                      SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                      IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                      INSERT INTO products (
                          name, category_id, type_id, description, is_battery, battery_state, cost_price
                      ) VALUES (
                          v_ti_name, v_parts_category_id, v_battery_type_id, 
                          'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                          TRUE, LOWER(v_ti_condition), v_ti_cost_price
                      ) RETURNING id INTO v_ti_product_id;
                  END IF;
                  SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
                  IF v_ti_inventory_id IS NOT NULL THEN
                      UPDATE inventory SET selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  ELSE
                      INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, 0, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  END IF;
                  
                  INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
              END IF;
          END LOOP;
      END IF;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- If you already applied 20260511200000 before current_volume ordering, this migration
-- reapplies the same function with ORDER BY current_volume (smallest remainder first).

-- Checkout: consume open lubricant stock from bottles with the least liquid REMAINING first
-- (current_volume ASC), then oldest opened_at. This finishes partial bottles (e.g. 1L left in a
-- 4L jug) before taking from another bottle. Ordering by initial_volume alone would prefer a
-- full 1L SKU over a 4L bottle’s last 1L, which is wrong for “lowest volume first” in practice.

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_product_id_text TEXT;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_sold_volume_per_unit NUMERIC;
  v_total_req_volume NUMERIC;
  v_bottles_to_open INTEGER;
  v_residual_open_volume NUMERIC;
  v_batch_deduction NUMERIC;
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_product_id := v_product_id_text::UUID;
        SELECT EXISTS (
          SELECT 1 FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = v_product_id
          AND (
            p.is_battery = TRUE OR
            (c.name = 'Parts' AND (p.name ILIKE '%battery%' OR p.name ILIKE '%batteries%')) OR
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        
        IF v_is_battery_sale THEN
          EXIT; 
        END IF;
    END IF;
  END LOOP;

  IF p_reference_number IS NOT NULL AND p_reference_number != '' THEN
    v_reference_number := p_reference_number;
  ELSE
    IF v_is_battery_sale THEN
      v_ref_prefix := 'B';
    ELSE
      CASE UPPER(p_type)
        WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
        WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
        WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
        WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
        ELSE v_ref_prefix := 'A';
      END CASE;
    END IF;

    INSERT INTO reference_number_counters (prefix, counter, updated_at)
    VALUES (v_ref_prefix, 0, NOW())
    ON CONFLICT (prefix) DO UPDATE
    SET counter = reference_number_counters.counter + 1, updated_at = NOW()
    RETURNING counter INTO v_counter;

    IF v_counter = 0 THEN
        UPDATE reference_number_counters
        SET counter = 1, updated_at = NOW()
        WHERE prefix = v_ref_prefix AND counter = 0
        RETURNING counter INTO v_counter;
    END IF;

    v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
        CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; 

    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    SELECT 
        p.name,
        EXISTS (
            SELECT 1 FROM products p2
            LEFT JOIN categories c ON p2.category_id = c.id
            WHERE p2.id = p.id
            AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
        )
    INTO v_product_name, v_is_lubricant
    FROM products p WHERE p.id = v_product_id;

    IF v_is_lubricant THEN
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '(^[0-9]+(\.[0-9]+)?)')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        v_sold_volume_per_unit := (substring(v_volume_desc from '(^[0-9]+(\.[0-9]+)?)'))::NUMERIC;
        IF v_sold_volume_per_unit IS NULL OR v_sold_volume_per_unit = 0 THEN
             v_sold_volume_per_unit := v_bottle_size;
        END IF;

        v_total_req_volume := v_sold_volume_per_unit * v_quantity;

        IF v_item_source = 'CLOSED' THEN
            v_bottles_to_open := CEIL(v_total_req_volume / v_bottle_size)::INTEGER;
            
            v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_total_req_volume;
            IF v_residual_open_volume > 0 THEN
                 -- This insertion fires the trigger to increment open bottles
                 INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                 VALUES (v_inventory_id, v_bottle_size, v_residual_open_volume, FALSE, NOW());
            END IF;
            
            v_batch_deduction := v_bottles_to_open;
            
        ELSIF v_item_source = 'OPEN' THEN
            v_remaining_qty := v_total_req_volume; 
            
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY current_volume ASC NULLS LAST, opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- These updates fire the trigger to decrement open bottles (if emptied)
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    v_remaining_qty := 0;
                ELSE
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                END IF;
            END LOOP;
            
            IF v_remaining_qty > 0 THEN
                v_batch_deduction := 1; 
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                -- This insertion fires the trigger to increment open bottles over writing any empties
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    ELSE
        v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO) --
    v_batch_remaining := v_batch_deduction; 
    
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC, batch_number ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            IF v_batch.stock_remaining > 0 THEN
                v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
                -- This update fires the trigger to update batches sum and standard stock
                UPDATE batches
                SET stock_remaining = stock_remaining - v_batch_alloc,
                    is_active_batch = (stock_remaining - v_batch_alloc > 0)
                    WHERE id = v_batch.id;
                v_batch_remaining := v_batch_remaining - v_batch_alloc;
            END IF;
        END LOOP;
        
        IF v_batch_remaining > 0 THEN
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_remaining,
                is_active_batch = TRUE
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id
                ORDER BY purchase_date DESC, batch_number DESC
                LIMIT 1
            );
            
            IF NOT FOUND THEN
                INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, is_active_batch, batch_number)
                VALUES (v_inventory_id, 0, -v_batch_remaining, 0, TRUE, 1);
            END IF;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM batches 
            WHERE inventory_id = v_inventory_id 
              AND is_active_batch = true 
              AND stock_remaining > 0
        ) THEN
            UPDATE batches
            SET is_active_batch = true
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id 
                  AND stock_remaining > 0
                ORDER BY purchase_date ASC, batch_number ASC
                LIMIT 1
            );
        END IF;
    END IF;

  END LOOP;
  
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NOT NULL THEN
          FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
          LOOP
              v_ti_size := v_trade_in->>'size';
              v_ti_condition := v_trade_in->>'condition';
              v_ti_name := v_trade_in->>'name';
              v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
              v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
              v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
              v_ti_product_id := NULL;
              v_ti_inventory_id := NULL;
              
              IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL THEN
                  SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name AND battery_state = LOWER(v_ti_condition) LIMIT 1;
                  IF v_ti_product_id IS NULL THEN
                      SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                      IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                      INSERT INTO products (
                          name, category_id, description, is_battery, battery_state, cost_price
                      ) VALUES (
                          v_ti_name, v_parts_category_id, 
                          'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                          TRUE, LOWER(v_ti_condition), v_ti_cost_price
                      ) RETURNING id INTO v_ti_product_id;
                  END IF;
                  SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
                  IF v_ti_inventory_id IS NOT NULL THEN
                      UPDATE inventory SET selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  ELSE
                      INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, 0, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  END IF;
                  
                  INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
              END IF;
          END LOOP;
      END IF;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Update reference number fallback format in create_checkout_transaction
-- Description: Align the fallback reference number generation with the new client-side A011230726 format.

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_product_id_text TEXT;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_total_avail_open NUMERIC;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_sold_volume_per_unit NUMERIC;
  v_total_req_volume NUMERIC;
  v_bottles_to_open INTEGER;
  v_residual_open_volume NUMERIC;
  v_batch_deduction NUMERIC;
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;
  
  -- Added for the new reference number format
  v_shop_code TEXT;
  v_mmyy TEXT;
  v_counter_prefix TEXT;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_product_id := v_product_id_text::UUID;
        SELECT EXISTS (
          SELECT 1 FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = v_product_id
          AND (
            p.is_battery = TRUE OR
            (c.name = 'Parts' AND (p.name ILIKE '%battery%' OR p.name ILIKE '%batteries%')) OR
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        
        IF v_is_battery_sale THEN
          EXIT; 
        END IF;
    END IF;
  END LOOP;

  IF p_reference_number IS NOT NULL AND p_reference_number != '' THEN
    v_reference_number := p_reference_number;
  ELSE
    IF v_is_battery_sale THEN
      v_ref_prefix := 'B';
    ELSE
      CASE UPPER(p_type)
        WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
        WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
        WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
        WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
        ELSE v_ref_prefix := 'A';
      END CASE;
    END IF;

    -- Fetch shop code to include in reference number and prefix key
    SELECT COALESCE(shop_code, '01') INTO v_shop_code FROM shops WHERE id = p_shop_id;
    IF v_shop_code IS NULL THEN
      v_shop_code := '01';
    END IF;

    v_mmyy := TO_CHAR(NOW() AT TIME ZONE 'Asia/Dubai', 'MMYY');
    v_counter_prefix := v_ref_prefix || '_' || v_shop_code || '_' || v_mmyy;

    INSERT INTO reference_number_counters (prefix, counter, updated_at)
    VALUES (v_counter_prefix, 0, NOW())
    ON CONFLICT (prefix) DO UPDATE
    SET counter = reference_number_counters.counter + 1, updated_at = NOW()
    RETURNING counter INTO v_counter;

    IF v_counter = 0 THEN
        UPDATE reference_number_counters
        SET counter = 1, updated_at = NOW()
        WHERE prefix = v_counter_prefix AND counter = 0
        RETURNING counter INTO v_counter;
    END IF;

    v_reference_number := v_ref_prefix || v_shop_code || LPAD(v_counter::TEXT, 3, '0') || v_mmyy;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
        CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED'); 
    v_volume_desc := v_item->>'volumeDescription';
    
    v_batch_deduction := 0; 

    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    SELECT 
        p.name,
        EXISTS (
            SELECT 1 FROM products p2
            LEFT JOIN categories c ON p2.category_id = c.id
            WHERE p2.id = p.id
            AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
        )
    INTO v_product_name, v_is_lubricant
    FROM products p WHERE p.id = v_product_id;

    IF v_is_lubricant THEN
        SELECT MAX(
            CASE 
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
                WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '(^[0-9]+(\.[0-9]+)?)')::NUMERIC
                ELSE 0 
            END
        ) INTO v_bottle_size
        FROM product_volumes WHERE product_id = v_product_id;
        
        IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN 
             v_bottle_size := 4.0; 
        END IF;

        v_sold_volume_per_unit := (substring(v_volume_desc from '(^[0-9]+(\.[0-9]+)?)'))::NUMERIC;
        IF v_sold_volume_per_unit IS NULL OR v_sold_volume_per_unit = 0 THEN
             v_sold_volume_per_unit := v_bottle_size;
        END IF;

        v_total_req_volume := v_sold_volume_per_unit * v_quantity;

        IF v_item_source = 'CLOSED' THEN
            v_bottles_to_open := CEIL(v_total_req_volume / v_bottle_size)::INTEGER;
            
            v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_total_req_volume;
            IF v_residual_open_volume > 0 THEN
                 -- This insertion fires the trigger to increment open bottles
                 INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                 VALUES (v_inventory_id, v_bottle_size, v_residual_open_volume, FALSE, NOW());
            END IF;
            
            v_batch_deduction := v_bottles_to_open;
            
        ELSIF v_item_source = 'OPEN' THEN
            v_remaining_qty := v_total_req_volume; 
            
            FOR v_open_bottle IN 
                SELECT id, current_volume, is_empty 
                FROM open_bottle_details 
                WHERE inventory_id = v_inventory_id AND is_empty = FALSE
                ORDER BY current_volume ASC NULLS LAST, opened_at ASC
                FOR UPDATE
            LOOP
                IF v_remaining_qty <= 0 THEN EXIT; END IF;
                
                IF v_open_bottle.current_volume >= v_remaining_qty THEN
                    -- These updates fire the trigger to decrement open bottles (if emptied)
                    UPDATE open_bottle_details 
                    SET current_volume = current_volume - v_remaining_qty,
                        is_empty = ((current_volume - v_remaining_qty) <= 0)
                    WHERE id = v_open_bottle.id;
                    v_remaining_qty := 0;
                ELSE
                    v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
                    UPDATE open_bottle_details 
                    SET current_volume = 0, is_empty = TRUE 
                    WHERE id = v_open_bottle.id;
                END IF;
            END LOOP;
            
            IF v_remaining_qty > 0 THEN
                v_batch_deduction := 1; 
                v_new_open_vol := v_bottle_size - v_remaining_qty;
                 IF v_new_open_vol < 0 THEN 
                    RAISE EXCEPTION 'Requested remainder (%L) exceeds new bottle size (%L). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size; 
                 END IF;
                 
                -- This insertion fires the trigger to increment open bottles over writing any empties
                INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
                VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
        END IF;

    -- BATCH ALLOCATION (FIFO) --
    ELSE
        v_batch_deduction := v_quantity;
    END IF;

    v_batch_remaining := v_batch_deduction; 
    
    IF v_batch_remaining > 0 THEN
        FOR v_batch IN 
            SELECT id, stock_remaining
            FROM batches
            WHERE inventory_id = v_inventory_id 
              AND (is_active_batch = TRUE OR stock_remaining > 0)
            ORDER BY purchase_date ASC, batch_number ASC
            FOR UPDATE SKIP LOCKED
        LOOP
            IF v_batch_remaining <= 0 THEN EXIT; END IF;
            
            IF v_batch.stock_remaining > 0 THEN
                v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
                -- This update fires the trigger to update batches sum and standard stock
                UPDATE batches
                SET stock_remaining = stock_remaining - v_batch_alloc,
                    is_active_batch = (stock_remaining - v_batch_alloc > 0)
                    WHERE id = v_batch.id;
                v_batch_remaining := v_batch_remaining - v_batch_alloc;
            END IF;
        END LOOP;
        
        IF v_batch_remaining > 0 THEN
            UPDATE batches
            SET stock_remaining = stock_remaining - v_batch_remaining,
                is_active_batch = TRUE
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id
                ORDER BY purchase_date DESC, batch_number DESC
                LIMIT 1
            );
            
            IF NOT FOUND THEN
                INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, is_active_batch, batch_number)
                VALUES (v_inventory_id, 0, -v_batch_remaining, 0, TRUE, 1);
            END IF;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM batches 
            WHERE inventory_id = v_inventory_id 
              AND is_active_batch = true 
              AND stock_remaining > 0
        ) THEN
            UPDATE batches
            SET is_active_batch = true
            WHERE id = (
                SELECT id FROM batches
                WHERE inventory_id = v_inventory_id 
                  AND stock_remaining > 0
                ORDER BY purchase_date ASC, batch_number ASC
                LIMIT 1
            );
        END IF;
    END IF;

  END LOOP;
  
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
      SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
      SELECT id INTO v_battery_type_id FROM types 
      WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

      IF v_parts_category_id IS NOT NULL THEN
          FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
          LOOP
              v_ti_size := v_trade_in->>'size';
              v_ti_condition := v_trade_in->>'condition';
              v_ti_name := v_trade_in->>'name';
              v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
              v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
              v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
              v_ti_product_id := NULL;
              v_ti_inventory_id := NULL;
              
              IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL THEN
                  SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name AND battery_state = LOWER(v_ti_condition) LIMIT 1;
                  IF v_ti_product_id IS NULL THEN
                      SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                      IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
                      INSERT INTO products (
                          name, category_id, description, is_battery, battery_state, cost_price
                      ) VALUES (
                          v_ti_name, v_parts_category_id, 
                          'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
                          TRUE, LOWER(v_ti_condition), v_ti_cost_price
                      ) RETURNING id INTO v_ti_product_id;
                  END IF;
                  SELECT trade_in_value INTO v_ti_selling_price 
                      FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
                  SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
                  IF v_ti_inventory_id IS NOT NULL THEN
                      UPDATE inventory SET selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  ELSE
                      INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, 0, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
                      INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
                  END IF;
                  
                  INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
              END IF;
          END LOOP;
      END IF;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_profits_estimate(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid)
 RETURNS numeric
 LANGUAGE sql
AS $function$
    WITH sold_items AS (
        SELECT 
            CASE WHEN t.type = 'REFUND' THEN -1 ELSE 1 END as multiplier,
            CASE 
                WHEN COALESCE(t.subtotal_before_discount, 0) > 0 THEN 
                   t.total_amount / t.subtotal_before_discount
                ELSE 
                   1
            END as revenue_ratio,
            COALESCE((item->>'sellingPrice')::numeric, 0) as selling_price,
            COALESCE((item->>'costPrice')::numeric, 0) as cost_price,
            COALESCE((item->>'quantity')::numeric, 0) as quantity
        FROM transactions t
        CROSS JOIN LATERAL jsonb_array_elements(t.items_sold) as item
        WHERE 
            t.created_at >= start_date
            AND t.created_at <= end_date
            AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID', 'REFUND')
            AND (filter_shop_id IS NULL OR t.shop_id = filter_shop_id)
    ),
    service_profits AS (
        SELECT 
            CASE WHEN t.type = 'REFUND' THEN -1 ELSE 1 END as multiplier,
            CASE 
                WHEN COALESCE(t.subtotal_before_discount, 0) > 0 THEN 
                   t.total_amount / t.subtotal_before_discount
                ELSE 
                   1
            END as revenue_ratio,
            COALESCE(s.unit_price, 0) as selling_price,
            COALESCE(s.cost_price, 0) as cost_price,
            COALESCE(s.quantity, 0) as quantity
        FROM transactions t
        JOIN service_items s ON s.transaction_id = t.id
        WHERE 
            t.created_at >= start_date
            AND t.created_at <= end_date
            AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID', 'REFUND')
            AND (filter_shop_id IS NULL OR t.shop_id = filter_shop_id)
            AND s.item_type IN ('service', 'labor', 'composite')
    ),
    combined AS (
        SELECT * FROM sold_items
        UNION ALL
        SELECT * FROM service_profits
    )
    SELECT 
        COALESCE(
            SUM(
                ((selling_price * quantity * revenue_ratio) - (cost_price * quantity)) * multiplier
            ), 0
        ) as profit
    FROM combined;
$function$;

-- Update all dashboard SQL functions to exclude voided transactions from financial calculations

-- ============================
-- 1. get_daily_sales
-- ============================
CREATE OR REPLACE FUNCTION public.get_daily_sales(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(sale_date date, total_sales numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('day', created_at AT TIME ZONE 'Asia/Muscat')::date as sale_date,
    SUM(
      CASE 
        WHEN type = 'REFUND' THEN -total_amount 
        ELSE total_amount 
      END
    ) as total_sales
  FROM transactions
  WHERE created_at >= start_date
    AND created_at <= end_date
    AND (filter_shop_id IS NULL OR shop_id = filter_shop_id)
    AND type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID', 'REFUND')
    AND is_voided = false
  GROUP BY 1
  ORDER BY 1;
END;
$function$;

-- ============================
-- 2. get_daily_payment_metrics
-- ============================
CREATE OR REPLACE FUNCTION public.get_daily_payment_metrics(query_date timestamp with time zone DEFAULT now(), target_shop_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(payment_method text, total_amount numeric, transaction_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  day_start timestamp with time zone;
  day_end timestamp with time zone;
BEGIN
  -- Convert query_date to Muscat time to find the start of the day in that timezone
  -- Then convert back to UTC for searching the created_at column
  day_start := date_trunc('day', query_date AT TIME ZONE 'Asia/Muscat') AT TIME ZONE 'Asia/Muscat';
  day_end := day_start + interval '1 day';

  RETURN QUERY
  SELECT
    t.payment_method,
    COALESCE(SUM(t.total_amount), 0) as total_amount,
    COUNT(*) as transaction_count
  FROM
    transactions t
  WHERE
    t.created_at >= day_start
    AND t.created_at < day_end
    AND t.type = 'SALE'
    AND (target_shop_id IS NULL OR t.shop_id = target_shop_id)
    AND t.payment_method IS NOT NULL
    AND t.is_voided = false
  GROUP BY
    t.payment_method;
END;
$function$;

-- ============================
-- 3. get_dashboard_profits_estimate
-- ============================
CREATE OR REPLACE FUNCTION public.get_dashboard_profits_estimate(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid)
 RETURNS numeric
 LANGUAGE sql
AS $function$
    WITH sold_items AS (
        SELECT 
            CASE WHEN t.type = 'REFUND' THEN -1 ELSE 1 END as multiplier,
            CASE 
                WHEN COALESCE(t.subtotal_before_discount, 0) > 0 THEN 
                   t.total_amount / t.subtotal_before_discount
                ELSE 
                   1
            END as revenue_ratio,
            COALESCE((item->>'sellingPrice')::numeric, 0) as selling_price,
            COALESCE((item->>'costPrice')::numeric, 0) as cost_price,
            COALESCE((item->>'quantity')::numeric, 0) as quantity
        FROM transactions t
        CROSS JOIN LATERAL jsonb_array_elements(t.items_sold) as item
        WHERE 
            t.created_at >= start_date
            AND t.created_at <= end_date
            AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID', 'REFUND')
            AND (filter_shop_id IS NULL OR t.shop_id = filter_shop_id)
            AND t.is_voided = false
    ),
    service_profits AS (
        SELECT 
            CASE WHEN t.type = 'REFUND' THEN -1 ELSE 1 END as multiplier,
            CASE 
                WHEN COALESCE(t.subtotal_before_discount, 0) > 0 THEN 
                   t.total_amount / t.subtotal_before_discount
                ELSE 
                   1
            END as revenue_ratio,
            COALESCE(s.unit_price, 0) as selling_price,
            COALESCE(s.cost_price, 0) as cost_price,
            COALESCE(s.quantity, 0) as quantity
        FROM transactions t
        JOIN service_items s ON s.transaction_id = t.id
        WHERE 
            t.created_at >= start_date
            AND t.created_at <= end_date
            AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID', 'REFUND')
            AND (filter_shop_id IS NULL OR t.shop_id = filter_shop_id)
            AND t.is_voided = false
            AND s.item_type IN ('service', 'labor', 'composite')
    ),
    combined AS (
        SELECT * FROM sold_items
        UNION ALL
        SELECT * FROM service_profits
    )
    SELECT 
        COALESCE(
            SUM(
                ((selling_price * quantity * revenue_ratio) - (cost_price * quantity)) * multiplier
            ), 0
        ) as profit
    FROM combined;
$function$;

-- ============================
-- 4. get_net_revenue
-- ============================
CREATE OR REPLACE FUNCTION public.get_net_revenue(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid)
 RETURNS numeric
 LANGUAGE sql
AS $function$
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN type = 'REFUND' THEN -total_amount 
                ELSE total_amount 
            END
        ), 0
    ) as net_revenue
    FROM transactions
    WHERE created_at >= start_date
      AND created_at <= end_date
      AND (filter_shop_id IS NULL OR shop_id = filter_shop_id)
      AND type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID', 'REFUND')
      AND is_voided = false;
$function$;

-- ============================
-- 5. get_dashboard_top_items
-- ============================
CREATE OR REPLACE FUNCTION public.get_dashboard_top_items(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(name text, units bigint, revenue numeric)
 LANGUAGE sql
AS $function$
    SELECT
        CASE 
            WHEN p.name IS NOT NULL THEN 
              TRIM(CONCAT(COALESCE(b.name, ''), ' ', p.name))
            WHEN item->>'name' IS NOT NULL THEN item->>'name'
            WHEN item->>'volumeDescription' IS NOT NULL THEN item->>'volumeDescription'
            ELSE 'Custom Item'
        END as product_name,
        SUM(COALESCE((item->>'quantity')::int, 0)) as units,
        SUM(COALESCE((item->>'sellingPrice')::numeric, (item->>'price')::numeric, 0) * COALESCE((item->>'quantity')::int, 0)) as revenue
    FROM transactions t
    CROSS JOIN LATERAL jsonb_array_elements(t.items_sold) as item
    LEFT JOIN products p ON p.id::text = (item->>'productId')
    LEFT JOIN brands b ON b.id = p.brand_id
    WHERE 
        t.created_at >= start_date
        AND t.created_at <= end_date
        AND (filter_shop_id IS NULL OR t.shop_id = filter_shop_id)
        AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID')
        AND t.is_voided = false
    GROUP BY product_name
    ORDER BY units DESC
    LIMIT 5;
$function$;

-- Migration: Add Services, Service Items, and Labor Splits
-- Description: Creates tables for service catalog, normalized line items, and labor charge splitting.
--              Backfills historical items_sold JSONB into service_items.
--              Updates checkout stored procedure to populate new tables.

-- ── 1. Create Tables ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'labor',
  default_price NUMERIC(10,3),
  estimated_duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS services_category_idx ON services(category);

CREATE INDEX IF NOT EXISTS services_name_lower_idx ON services(lower(name));

CREATE TABLE IF NOT EXISTS service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service', 'labor', 'composite')),
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,3) NOT NULL,
  cost_price NUMERIC(10,3) DEFAULT 0,
  discount_amount NUMERIC(10,3) DEFAULT 0,
  volume_description TEXT,
  source TEXT CHECK (source IN ('OPEN', 'CLOSED')),
  batch_id UUID REFERENCES batches(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_items_transaction_idx ON service_items(transaction_id);

CREATE INDEX IF NOT EXISTS service_items_product_idx ON service_items(product_id);

CREATE INDEX IF NOT EXISTS service_items_service_idx ON service_items(service_id);

CREATE INDEX IF NOT EXISTS service_items_type_idx ON service_items(item_type);

CREATE TABLE IF NOT EXISTS labor_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_item_id UUID NOT NULL REFERENCES service_items(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE RESTRICT,
  split_type TEXT NOT NULL CHECK (split_type IN ('technician_share', 'parts_portion', 'labor_portion')),
  amount NUMERIC(10,3) NOT NULL,
  percentage NUMERIC(5,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS labor_splits_service_item_idx ON labor_splits(service_item_id);

CREATE INDEX IF NOT EXISTS labor_splits_staff_idx ON labor_splits(staff_id);

-- ── 2. RLS Policies ──────────────────────────────────────────────────────

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view services" ON services
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert services" ON services
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update services" ON services
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete services" ON services
  FOR DELETE TO authenticated USING (true);

ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view service items" ON service_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert service items" ON service_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update service items" ON service_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete service items" ON service_items
  FOR DELETE TO authenticated USING (true);

ALTER TABLE labor_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view labor splits" ON labor_splits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert labor splits" ON labor_splits
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update labor splits" ON labor_splits
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete labor splits" ON labor_splits
  FOR DELETE TO authenticated USING (true);

-- ── 3. Backfill Historical Data ──────────────────────────────────────────
-- Populate service_items from existing items_sold JSONB

INSERT INTO service_items (transaction_id, item_type, name, quantity, unit_price, cost_price, volume_description, source, created_at)
SELECT
  t.id,
  CASE
    WHEN item->>'productId' = '9999' THEN 'labor'
    ELSE 'product'
  END AS item_type,
  COALESCE(
    item->>'volumeDescription',
    item->>'name',
    'Unknown Item'
  ) AS name,
  COALESCE((item->>'quantity')::NUMERIC, 1) AS quantity,
  COALESCE((item->>'sellingPrice')::NUMERIC, 0) AS unit_price,
  COALESCE((item->>'costPrice')::NUMERIC, 0) AS cost_price,
  item->>'volumeDescription' AS volume_description,
  item->>'source' AS source,
  t.created_at
FROM transactions t
CROSS JOIN LATERAL jsonb_array_elements(t.items_sold) AS item
WHERE NOT t.is_voided
  AND t.items_sold IS NOT NULL
  AND jsonb_array_length(t.items_sold) > 0
  AND NOT EXISTS (
    SELECT 1 FROM service_items si WHERE si.transaction_id = t.id
  );

-- ── 4. Seed Default Service Catalog ──────────────────────────────────────

INSERT INTO services (name, name_ar, description, category, default_price) VALUES
  ('Labor - Custom Service', 'خدمة مخصصة', 'General custom labor service', 'labor', NULL),
  ('Oil Change', 'تغيير زيت', 'Full synthetic oil change service', 'labor', 3.000),
  ('Brake Disc Repair', 'إصلاح قرص الفرامل', 'Brake disc resurfacing or replacement', 'labor', 5.000),
  ('Axle Service', 'خدمة المحور', 'Axle inspection and repair', 'labor', 8.000),
  ('Tire Rotation', 'تدوير الإطارات', 'Tire rotation and balancing', 'labor', 2.000),
  ('Wheel Alignment', 'محاذاة العجلات', 'Four-wheel alignment', 'labor', 3.000),
  ('Battery Replacement', 'تبديل البطارية', 'Battery installation and testing', 'labor', 1.000),
  ('AC Service', 'خدمة التكييف', 'AC system inspection and recharge', 'labor', 4.000),
  ('Engine Diagnostic', 'تشخيص المحرك', 'Computer engine diagnostic scan', 'diagnostic', 5.000),
  ('General Inspection', 'فحص عام', 'Comprehensive vehicle inspection', 'diagnostic', 3.000)
ON CONFLICT DO NOTHING;

-- ── 5. Update Stored Procedure ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_services JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_product_id_text TEXT;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_batch_deduction NUMERIC;

  -- Trade-in variables
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;

  -- Service items variables
  v_service JSONB;
  v_service_item_id UUID;
  v_si_name TEXT;
  v_si_amount NUMERIC;
  v_si_quantity NUMERIC;
  v_si_service_id UUID;
  v_labor_split JSONB;
BEGIN
  -- 1. Validate inputs
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Verify location exists
  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- 2. Determine Reference Number
  IF p_reference_number IS NOT NULL AND p_reference_number != '' THEN
    v_reference_number := p_reference_number;
    -- Determine prefix from reference number
    IF v_reference_number ~ '^WB' THEN v_ref_prefix := 'WB';
    ELSIF v_reference_number ~ '^OH' THEN v_ref_prefix := 'OH';
    ELSIF v_reference_number ~ '^ST' THEN v_ref_prefix := 'ST';
    ELSIF v_reference_number ~ '^B' THEN v_ref_prefix := 'B';
    ELSIF v_reference_number ~ '^R' THEN v_ref_prefix := 'R';
    ELSE v_ref_prefix := 'A';
    END IF;
  ELSE
    -- Check for battery sale
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_product_id_text := v_item->>'productId';
      IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_product_id := v_product_id_text::UUID;
        SELECT EXISTS (
          SELECT 1 FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = v_product_id
          AND (
            p.is_battery = TRUE OR
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        IF v_is_battery_sale THEN EXIT; END IF;
      END IF;
    END LOOP;

    IF v_is_battery_sale THEN
      v_ref_prefix := 'B';
    ELSE
      CASE UPPER(p_type)
        WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
        WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
        WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
        WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
        ELSE v_ref_prefix := 'A';
      END CASE;
    END IF;

    -- Generate Reference Number
    INSERT INTO reference_number_counters (prefix, counter, updated_at)
    VALUES (v_ref_prefix, 0, NOW())
    ON CONFLICT (prefix) DO UPDATE
    SET counter = reference_number_counters.counter + 1, updated_at = NOW()
    RETURNING counter INTO v_counter;

    IF v_counter = 0 THEN
      UPDATE reference_number_counters
      SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
    END IF;

    v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');
  END IF;

  -- 3. Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';

    -- Skip inventory logic for non-UUID items (Labor Charge, etc.)
    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
      CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED');
    v_volume_desc := v_item->>'volumeDescription';
    v_batch_deduction := 0;

    -- Lock Inventory Row
    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Get Product Type
    SELECT EXISTS (
      SELECT 1 FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = v_product_id
      AND (
        (p.product_type IS NOT NULL AND (p.product_type ILIKE 'lubricant%' OR p.product_type ILIKE 'oil%' OR p.product_type ILIKE 'fluid%')) OR
        (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%'))
      )
    ) INTO v_is_lubricant;

    IF v_is_lubricant THEN
      -- LUBRICANT LOGIC
      SELECT MAX(
        CASE
          WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
          WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '^[0-9]+(\.[0-9]+)?')::NUMERIC
          ELSE 0
        END
      ) INTO v_bottle_size
      FROM product_volumes WHERE product_id = v_product_id;

      IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN
        v_bottle_size := 4.0;
      END IF;

      IF v_item_source = 'CLOSED' THEN
        IF v_closed_bottles < v_quantity THEN
          RAISE EXCEPTION 'No closed bottles available for product % (Requested: %, Available: %)', v_product_id, v_quantity, v_closed_bottles;
        END IF;
        UPDATE inventory
        SET closed_bottles_stock = closed_bottles_stock - v_quantity::INTEGER
        WHERE id = v_inventory_id;
        v_batch_deduction := v_quantity;
      ELSIF v_item_source = 'OPEN' THEN
        v_remaining_qty := v_quantity;
        FOR v_open_bottle IN
          SELECT id, current_volume, is_empty
          FROM open_bottle_details
          WHERE inventory_id = v_inventory_id AND is_empty = FALSE
          ORDER BY opened_at ASC
          FOR UPDATE
        LOOP
          IF v_remaining_qty <= 0 THEN EXIT; END IF;
          IF v_open_bottle.current_volume >= v_remaining_qty THEN
            UPDATE open_bottle_details
            SET current_volume = current_volume - v_remaining_qty,
                is_empty = ((current_volume - v_remaining_qty) <= 0)
            WHERE id = v_open_bottle.id;
            IF (v_open_bottle.current_volume - v_remaining_qty) <= 0 THEN
              UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
            END IF;
            v_remaining_qty := 0;
          ELSE
            v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
            UPDATE open_bottle_details
            SET current_volume = 0, is_empty = TRUE
            WHERE id = v_open_bottle.id;
            UPDATE inventory SET open_bottles_stock = open_bottles_stock - 1 WHERE id = v_inventory_id;
          END IF;
        END LOOP;
        IF v_remaining_qty > 0 THEN
          IF v_closed_bottles < 1 THEN
            RAISE EXCEPTION 'Insufficient volume in open bottles and no closed bottles available';
          END IF;
          UPDATE inventory
          SET closed_bottles_stock = closed_bottles_stock - 1
          WHERE id = v_inventory_id;
          v_batch_deduction := 1;
          v_new_open_vol := v_bottle_size - v_remaining_qty;
          IF v_new_open_vol < 0 THEN
            RAISE EXCEPTION 'Requested remainder (%) exceeds new bottle size (%). Overflow limited to 1 bottle.', v_remaining_qty, v_bottle_size;
          END IF;
          INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
          VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
          IF v_new_open_vol > 0 THEN
            UPDATE inventory SET open_bottles_stock = open_bottles_stock + 1 WHERE id = v_inventory_id;
          END IF;
        END IF;
      ELSE
        RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
      END IF;
    ELSE
      -- STANDARD PRODUCT
      UPDATE inventory
      SET standard_stock = standard_stock - v_quantity
      WHERE id = v_inventory_id;
      v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO)
    v_batch_remaining := v_batch_deduction;
    IF v_batch_remaining > 0 THEN
      FOR v_batch IN
        SELECT id, stock_remaining
        FROM batches
        WHERE inventory_id = v_inventory_id
          AND (is_active_batch = TRUE OR stock_remaining > 0)
        ORDER BY purchase_date ASC, batch_number ASC
        FOR UPDATE SKIP LOCKED
      LOOP
        IF v_batch_remaining <= 0 THEN EXIT; END IF;
        v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
        UPDATE batches
        SET stock_remaining = stock_remaining - v_batch_alloc,
            is_active_batch = (stock_remaining - v_batch_alloc > 0)
        WHERE id = v_batch.id;
        v_batch_remaining := v_batch_remaining - v_batch_alloc;
      END LOOP;
      -- ROLLOVER LOGIC
      IF NOT EXISTS (
        SELECT 1 FROM batches
        WHERE inventory_id = v_inventory_id
          AND is_active_batch = true
          AND stock_remaining > 0
      ) THEN
        UPDATE batches
        SET is_active_batch = true
        WHERE id = (
          SELECT id FROM batches
          WHERE inventory_id = v_inventory_id
            AND stock_remaining > 0
          ORDER BY purchase_date ASC, batch_number ASC
          LIMIT 1
        );
      END IF;
    END IF;
  END LOOP;

  -- 4. Create Transaction Record
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    notes, created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    p_notes, NOW()
  ) RETURNING id INTO v_transaction_id;

  -- 5. Populate service_items from cart items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';

    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      -- Product item
      INSERT INTO service_items (
        transaction_id, item_type, product_id, name, quantity, unit_price, cost_price, volume_description, source
      ) VALUES (
        v_transaction_id,
        'product',
        v_product_id_text::UUID,
        COALESCE(v_item->>'volumeDescription', v_item->>'name', 'Unknown'),
        COALESCE((v_item->>'quantity')::NUMERIC, 1),
        COALESCE((v_item->>'sellingPrice')::NUMERIC, 0),
        COALESCE((v_item->>'costPrice')::NUMERIC, 0),
        v_item->>'volumeDescription',
        v_item->>'source'
      );
    ELSE
      -- Service/Labor item (non-UUID, e.g. '9999')
      INSERT INTO service_items (
        transaction_id, item_type, name, quantity, unit_price, cost_price, volume_description
      ) VALUES (
        v_transaction_id,
        'labor',
        COALESCE(v_item->>'volumeDescription', v_item->>'name', 'Labor Service'),
        COALESCE((v_item->>'quantity')::NUMERIC, 1),
        COALESCE((v_item->>'sellingPrice')::NUMERIC, 0),
        0,
        v_item->>'volumeDescription'
      );
    END IF;
  END LOOP;

  -- 6. Populate service_items and labor_splits from p_services (if provided)
  IF p_services IS NOT NULL AND jsonb_array_length(p_services) > 0 THEN
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
    LOOP
      v_si_name := v_service->>'name';
      v_si_amount := (v_service->>'amount')::NUMERIC;
      v_si_quantity := COALESCE((v_service->>'quantity')::NUMERIC, 1);

      -- Resolve service_id if provided
      v_si_service_id := NULL;
      IF v_service->>'serviceId' IS NOT NULL AND v_service->>'serviceId' != '' THEN
        IF (v_service->>'serviceId') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
          v_si_service_id := (v_service->>'serviceId')::UUID;
        END IF;
      END IF;

      -- If no service_id, try to find by name
      IF v_si_service_id IS NULL AND v_si_name IS NOT NULL THEN
        SELECT id INTO v_si_service_id FROM services
        WHERE lower(name) = lower(v_si_name) AND is_active = true
        LIMIT 1;
      END IF;

      -- Determine item_type based on service category
      DECLARE
        v_service_category TEXT;
      BEGIN
        IF v_si_service_id IS NOT NULL THEN
          SELECT category INTO v_service_category FROM services WHERE id = v_si_service_id;
        END IF;

        INSERT INTO service_items (
          transaction_id, item_type, service_id, name, quantity, unit_price, cost_price, notes
        ) VALUES (
          v_transaction_id,
          COALESCE(v_service_category, 'service'),
          v_si_service_id,
          COALESCE(v_si_name, 'Custom Service'),
          v_si_quantity,
          v_si_amount,
          0,
          v_service->>'description'
        ) RETURNING id INTO v_service_item_id;

        -- Insert labor splits if provided
        IF v_service->>'splits' IS NOT NULL AND jsonb_array_length((v_service->>'splits')::JSONB) > 0 THEN
          FOR v_labor_split IN SELECT * FROM jsonb_array_elements((v_service->>'splits')::JSONB)
          LOOP
            INSERT INTO labor_splits (
              service_item_id, staff_id, split_type, amount, percentage, description
            ) VALUES (
              v_service_item_id,
              CASE WHEN v_labor_split->>'staffId' IS NOT NULL AND (v_labor_split->>'staffId') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                THEN (v_labor_split->>'staffId')::UUID
                ELSE NULL
              END,
              COALESCE(v_labor_split->>'splitType', 'technician_share'),
              COALESCE((v_labor_split->>'amount')::NUMERIC, 0),
              (v_labor_split->>'percentage')::NUMERIC,
              v_labor_split->>'description'
            );
          END LOOP;
        END IF;
      END;
    END LOOP;
  END IF;

  -- 7. Process Trade-Ins
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
    SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
    SELECT id INTO v_battery_type_id FROM types
    WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

    IF v_parts_category_id IS NULL THEN NULL; END IF;

    FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
    LOOP
      v_ti_size := v_trade_in->>'size';
      v_ti_condition := v_trade_in->>'condition';
      v_ti_name := v_trade_in->>'name';
      v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
      v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
      v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
      v_ti_product_id := NULL;

      IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL AND v_parts_category_id IS NOT NULL THEN
        SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
        IF v_ti_product_id IS NULL THEN
          SELECT trade_in_value INTO v_ti_selling_price
          FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
          IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
          INSERT INTO products (
            name, category_id, type_id, description, is_battery, battery_state, cost_price
          ) VALUES (
            v_ti_name, v_parts_category_id, v_battery_type_id,
            'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
            TRUE, LOWER(v_ti_condition), v_ti_cost_price
          ) RETURNING id INTO v_ti_product_id;
        END IF;
        SELECT trade_in_value INTO v_ti_selling_price
        FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
        SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
        IF v_ti_inventory_id IS NOT NULL THEN
          UPDATE inventory SET standard_stock = standard_stock + v_ti_quantity, selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
        ELSE
          INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (v_ti_product_id, p_location_id, v_ti_quantity, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
        END IF;
        INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch) VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
        INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value) VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
      END IF;
    END LOOP;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Fix checkout - restore void columns, update stored procedure
-- This fixes the 500 error caused by parameter count mismatch

-- ── 1. Restore deleted void columns ──────────────────────────────────────

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_voided BOOLEAN DEFAULT false;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voided_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS void_reason TEXT;

-- ── 2. Recreate stored procedure with correct 19-param signature ────────

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_services JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_product_id_text TEXT;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_batch_deduction NUMERIC;
  v_sold_volume_per_unit NUMERIC;
  v_total_req_volume NUMERIC;
  v_bottles_to_open INTEGER;
  v_residual_open_volume NUMERIC;

  -- Trade-in variables
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;

  -- Service items variables
  v_service JSONB;
  v_service_item_id UUID;
  v_si_name TEXT;
  v_si_amount NUMERIC;
  v_si_quantity NUMERIC;
  v_si_service_id UUID;
  v_service_category TEXT;
  v_labor_split JSONB;
BEGIN
  -- Validate inputs — allow empty cart when services (labor) are present
  IF (p_items IS NULL OR jsonb_array_length(p_items) = 0)
     AND (p_services IS NULL OR jsonb_array_length(p_services) = 0) THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- Reference number handling
  IF p_reference_number IS NOT NULL AND p_reference_number != '' THEN
    v_reference_number := p_reference_number;
    IF v_reference_number ~ '^WB' THEN v_ref_prefix := 'WB';
    ELSIF v_reference_number ~ '^OH' THEN v_ref_prefix := 'OH';
    ELSIF v_reference_number ~ '^ST' THEN v_ref_prefix := 'ST';
    ELSIF v_reference_number ~ '^B' THEN v_ref_prefix := 'B';
    ELSIF v_reference_number ~ '^R' THEN v_ref_prefix := 'R';
    ELSE v_ref_prefix := 'A';
    END IF;
  ELSE
    -- Check for battery sale
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_product_id_text := v_item->>'productId';
      IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_product_id := v_product_id_text::UUID;
        SELECT EXISTS (
          SELECT 1 FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = v_product_id
          AND (
            p.is_battery = TRUE OR
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        IF v_is_battery_sale THEN EXIT; END IF;
      END IF;
    END LOOP;

    IF v_is_battery_sale THEN
      v_ref_prefix := 'B';
    ELSE
      CASE UPPER(p_type)
        WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
        WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
        WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
        WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
        ELSE v_ref_prefix := 'A';
      END CASE;
    END IF;

    INSERT INTO reference_number_counters (prefix, counter, updated_at)
    VALUES (v_ref_prefix, 0, NOW())
    ON CONFLICT (prefix) DO UPDATE
    SET counter = reference_number_counters.counter + 1, updated_at = NOW()
    RETURNING counter INTO v_counter;

    IF v_counter = 0 THEN
      UPDATE reference_number_counters SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
    END IF;

    v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');
  END IF;

  -- Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';

    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
      CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED');
    v_volume_desc := v_item->>'volumeDescription';
    v_batch_deduction := 0;

    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    SELECT p.name, EXISTS (
      SELECT 1 FROM products p2
      LEFT JOIN categories c ON p2.category_id = c.id
      WHERE p2.id = p.id
      AND (c.name IS NOT NULL AND (c.name ILIKE 'lubricant%' OR c.name ILIKE 'oil%' OR c.name ILIKE 'fluid%' OR c.name ILIKE 'additive%'))
    ) INTO v_product_name, v_is_lubricant
    FROM products p WHERE p.id = v_product_id;

    IF v_is_lubricant THEN
      SELECT MAX(
        CASE
          WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?$' THEN volume_description::NUMERIC
          WHEN volume_description ~ '^[0-9]+(\.[0-9]+)?\s*[Ll]' THEN substring(volume_description from '(^[0-9]+(\.[0-9]+)?)')::NUMERIC
          ELSE 0
        END
      ) INTO v_bottle_size
      FROM product_volumes WHERE product_id = v_product_id;

      IF v_bottle_size IS NULL OR v_bottle_size = 0 THEN v_bottle_size := 4.0; END IF;

      v_sold_volume_per_unit := (substring(v_volume_desc from '(^[0-9]+(\.[0-9]+)?)'))::NUMERIC;
      IF v_sold_volume_per_unit IS NULL OR v_sold_volume_per_unit = 0 THEN
        v_sold_volume_per_unit := v_bottle_size;
      END IF;

      v_total_req_volume := v_sold_volume_per_unit * v_quantity;

      IF v_item_source = 'CLOSED' THEN
        v_bottles_to_open := CEIL(v_total_req_volume / v_bottle_size)::INTEGER;
        v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_total_req_volume;
        IF v_residual_open_volume > 0 THEN
          INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
          VALUES (v_inventory_id, v_bottle_size, v_residual_open_volume, FALSE, NOW());
        END IF;
        v_batch_deduction := v_bottles_to_open;

      ELSIF v_item_source = 'OPEN' THEN
        v_remaining_qty := v_total_req_volume;
        FOR v_open_bottle IN
          SELECT id, current_volume, is_empty
          FROM open_bottle_details
          WHERE inventory_id = v_inventory_id AND is_empty = FALSE
          ORDER BY opened_at ASC FOR UPDATE
        LOOP
          IF v_remaining_qty <= 0 THEN EXIT; END IF;
          IF v_open_bottle.current_volume >= v_remaining_qty THEN
            UPDATE open_bottle_details
            SET current_volume = current_volume - v_remaining_qty,
                is_empty = ((current_volume - v_remaining_qty) <= 0)
            WHERE id = v_open_bottle.id;
            v_remaining_qty := 0;
          ELSE
            v_remaining_qty := v_remaining_qty - v_open_bottle.current_volume;
            UPDATE open_bottle_details SET current_volume = 0, is_empty = TRUE WHERE id = v_open_bottle.id;
          END IF;
        END LOOP;
        IF v_remaining_qty > 0 THEN
          v_batch_deduction := 1;
          v_new_open_vol := v_bottle_size - v_remaining_qty;
          IF v_new_open_vol < 0 THEN
            RAISE EXCEPTION 'Requested remainder (%) exceeds new bottle size (%)', v_remaining_qty, v_bottle_size;
          END IF;
          INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
          VALUES (v_inventory_id, v_bottle_size, v_new_open_vol, (v_new_open_vol <= 0), NOW());
        END IF;
      ELSE
        RAISE EXCEPTION 'Invalid item source for lubricant: %', v_item_source;
      END IF;
    ELSE
      v_batch_deduction := v_quantity;
    END IF;

    -- BATCH ALLOCATION (FIFO)
    v_batch_remaining := v_batch_deduction;
    IF v_batch_remaining > 0 THEN
      FOR v_batch IN
        SELECT id, stock_remaining FROM batches
        WHERE inventory_id = v_inventory_id AND (is_active_batch = TRUE OR stock_remaining > 0)
        ORDER BY purchase_date ASC, batch_number ASC FOR UPDATE SKIP LOCKED
      LOOP
        IF v_batch_remaining <= 0 THEN EXIT; END IF;
        IF v_batch.stock_remaining > 0 THEN
          v_batch_alloc := LEAST(v_batch.stock_remaining, v_batch_remaining);
          UPDATE batches
          SET stock_remaining = stock_remaining - v_batch_alloc,
              is_active_batch = (stock_remaining - v_batch_alloc > 0)
          WHERE id = v_batch.id;
          v_batch_remaining := v_batch_remaining - v_batch_alloc;
        END IF;
      END LOOP;

      IF NOT EXISTS (
        SELECT 1 FROM batches WHERE inventory_id = v_inventory_id AND is_active_batch = true AND stock_remaining > 0
      ) THEN
        UPDATE batches SET is_active_batch = true
        WHERE id = (
          SELECT id FROM batches WHERE inventory_id = v_inventory_id AND stock_remaining > 0
          ORDER BY purchase_date ASC, batch_number ASC LIMIT 1
        );
      END IF;
    END IF;
  END LOOP;

  -- Create Transaction Record
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    notes, created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    p_notes, NOW()
  ) RETURNING id INTO v_transaction_id;

  -- Populate service_items from cart items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      INSERT INTO service_items (transaction_id, item_type, product_id, name, quantity, unit_price, cost_price, volume_description, source)
      VALUES (v_transaction_id, 'product', v_product_id_text::UUID,
        COALESCE(v_item->>'volumeDescription', v_item->>'name', 'Unknown'),
        COALESCE((v_item->>'quantity')::NUMERIC, 1),
        COALESCE((v_item->>'sellingPrice')::NUMERIC, 0),
        COALESCE((v_item->>'costPrice')::NUMERIC, 0),
        v_item->>'volumeDescription', v_item->>'source');
    ELSE
      INSERT INTO service_items (transaction_id, item_type, name, quantity, unit_price, cost_price, volume_description)
      VALUES (v_transaction_id, 'labor',
        COALESCE(v_item->>'volumeDescription', v_item->>'name', 'Labor Service'),
        COALESCE((v_item->>'quantity')::NUMERIC, 1),
        COALESCE((v_item->>'sellingPrice')::NUMERIC, 0), 0,
        v_item->>'volumeDescription');
    END IF;
  END LOOP;

  -- Populate service_items and labor_splits from p_services
  IF p_services IS NOT NULL AND jsonb_array_length(p_services) > 0 THEN
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
    LOOP
      v_si_name := v_service->>'name';
      v_si_amount := (v_service->>'amount')::NUMERIC;
      v_si_quantity := COALESCE((v_service->>'quantity')::NUMERIC, 1);
      v_si_service_id := NULL;

      IF v_service->>'serviceId' IS NOT NULL AND v_service->>'serviceId' != '' THEN
        IF (v_service->>'serviceId') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
          v_si_service_id := (v_service->>'serviceId')::UUID;
        END IF;
      END IF;

      IF v_si_service_id IS NULL AND v_si_name IS NOT NULL THEN
        SELECT id INTO v_si_service_id FROM services
        WHERE lower(name) = lower(v_si_name) AND is_active = true LIMIT 1;
      END IF;

      v_service_category := 'service';
      IF v_si_service_id IS NOT NULL THEN
        SELECT category INTO v_service_category FROM services WHERE id = v_si_service_id;
      END IF;

      INSERT INTO service_items (transaction_id, item_type, service_id, name, quantity, unit_price, cost_price, notes)
      VALUES (v_transaction_id, COALESCE(v_service_category, 'service'), v_si_service_id,
        COALESCE(v_si_name, 'Custom Service'), v_si_quantity, v_si_amount, 0, v_service->>'description')
      RETURNING id INTO v_service_item_id;

      IF v_service->>'splits' IS NOT NULL AND jsonb_array_length((v_service->>'splits')::JSONB) > 0 THEN
        FOR v_labor_split IN SELECT * FROM jsonb_array_elements((v_service->>'splits')::JSONB)
        LOOP
          INSERT INTO labor_splits (service_item_id, staff_id, split_type, amount, percentage, description)
          VALUES (v_service_item_id,
            CASE WHEN v_labor_split->>'staffId' IS NOT NULL AND (v_labor_split->>'staffId') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
              THEN (v_labor_split->>'staffId')::UUID ELSE NULL END,
            COALESCE(v_labor_split->>'splitType', 'technician_share'),
            COALESCE((v_labor_split->>'amount')::NUMERIC, 0),
            (v_labor_split->>'percentage')::NUMERIC,
            v_labor_split->>'description');
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- Process Trade-Ins
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
    SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
    SELECT id INTO v_battery_type_id FROM types WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

    IF v_parts_category_id IS NOT NULL THEN
      FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
      LOOP
        v_ti_size := v_trade_in->>'size';
        v_ti_condition := v_trade_in->>'condition';
        v_ti_name := v_trade_in->>'name';
        v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
        v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
        v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;
        v_ti_product_id := NULL;

        IF v_ti_size IS NOT NULL AND v_ti_condition IS NOT NULL THEN
          SELECT id INTO v_ti_product_id FROM products WHERE name = v_ti_name LIMIT 1;
          IF v_ti_product_id IS NULL THEN
            SELECT trade_in_value INTO v_ti_selling_price FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
            IF v_ti_selling_price IS NULL THEN v_ti_selling_price := 0; END IF;
            INSERT INTO products (name, category_id, type_id, description, is_battery, battery_state, cost_price)
            VALUES (v_ti_name, v_parts_category_id, v_battery_type_id,
              'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')',
              TRUE, LOWER(v_ti_condition), v_ti_cost_price)
            RETURNING id INTO v_ti_product_id;
          END IF;
          SELECT trade_in_value INTO v_ti_selling_price FROM trade_in_prices WHERE size = v_ti_size AND condition ILIKE v_ti_condition;
          SELECT id INTO v_ti_inventory_id FROM inventory WHERE product_id = v_ti_product_id AND location_id = p_location_id;
          IF v_ti_inventory_id IS NOT NULL THEN
            UPDATE inventory SET selling_price = COALESCE(v_ti_selling_price, selling_price) WHERE id = v_ti_inventory_id;
          ELSE
            INSERT INTO inventory (product_id, location_id, standard_stock, selling_price)
            VALUES (v_ti_product_id, p_location_id, 0, v_ti_selling_price) RETURNING id INTO v_ti_inventory_id;
          END IF;
          INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, supplier, is_active_batch)
          VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, 'Trade-in (' || v_ti_condition || ')', TRUE);
          INSERT INTO trade_in_transactions (transaction_id, product_id, quantity, trade_in_value)
          VALUES (v_transaction_id, v_ti_product_id, v_ti_quantity, v_ti_trade_in_value);
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

-- Migration: Fix create_checkout_transaction to allow labor-only checkouts
-- The previous validation rejected empty p_items even when p_services had items

CREATE OR REPLACE FUNCTION create_checkout_transaction(
  p_location_id UUID,
  p_shop_id UUID,
  p_cashier_id UUID,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_discount_value NUMERIC DEFAULT NULL,
  p_discount_type TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_subtotal_before_discount NUMERIC DEFAULT NULL,
  p_car_plate_number TEXT DEFAULT NULL,
  p_mobile_payment_account TEXT DEFAULT NULL,
  p_mobile_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_trade_ins JSONB DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_services JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_reference_number TEXT;
  v_ref_prefix TEXT;
  v_item JSONB;
  v_product_id UUID;
  v_product_id_text TEXT;
  v_quantity NUMERIC;
  v_item_source TEXT;
  v_volume_desc TEXT;
  v_inventory_id UUID;
  v_standard_stock INTEGER;
  v_closed_bottles INTEGER;
  v_open_bottles INTEGER;
  v_product_name TEXT;
  v_is_lubricant BOOLEAN;
  v_bottle_size NUMERIC;
  v_remaining_qty NUMERIC;
  v_open_bottle RECORD;
  v_new_open_vol NUMERIC;
  v_counter INTEGER;
  v_is_battery_sale BOOLEAN := FALSE;
  v_batch RECORD;
  v_batch_alloc NUMERIC;
  v_batch_remaining NUMERIC;
  v_batch_deduction NUMERIC;
  v_sold_volume_per_unit NUMERIC;
  v_total_req_volume NUMERIC;
  v_bottles_to_open INTEGER;
  v_residual_open_volume NUMERIC;

  -- Trade-in variables
  v_trade_in JSONB;
  v_ti_size TEXT;
  v_ti_condition TEXT;
  v_ti_name TEXT;
  v_ti_cost_price NUMERIC;
  v_ti_quantity INTEGER;
  v_ti_trade_in_value NUMERIC;
  v_parts_category_id UUID;
  v_battery_type_id UUID;
  v_ti_product_id UUID;
  v_ti_inventory_id UUID;
  v_ti_selling_price NUMERIC;

  -- Service items variables
  v_service JSONB;
  v_service_item_id UUID;
  v_si_name TEXT;
  v_si_amount NUMERIC;
  v_si_quantity NUMERIC;
  v_si_service_id UUID;
  v_service_category TEXT;
  v_labor_split JSONB;
BEGIN
  -- Validate inputs — allow empty cart when services (labor) are present
  IF (p_items IS NULL OR jsonb_array_length(p_items) = 0)
     AND (p_services IS NULL OR jsonb_array_length(p_services) = 0) THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  PERFORM 1 FROM locations WHERE id = p_location_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Location not found: %', p_location_id;
  END IF;

  -- Reference number handling
  IF p_reference_number IS NOT NULL AND p_reference_number != '' THEN
    v_reference_number := p_reference_number;
    IF v_reference_number ~ '^WB' THEN v_ref_prefix := 'WB';
    ELSIF v_reference_number ~ '^OH' THEN v_ref_prefix := 'OH';
    ELSIF v_reference_number ~ '^ST' THEN v_ref_prefix := 'ST';
    ELSIF v_reference_number ~ '^B' THEN v_ref_prefix := 'B';
    ELSIF v_reference_number ~ '^R' THEN v_ref_prefix := 'R';
    ELSE v_ref_prefix := 'A';
    END IF;
  ELSE
    -- Check for battery sale
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_product_id_text := v_item->>'productId';
      IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
        v_product_id := v_product_id_text::UUID;
        SELECT EXISTS (
          SELECT 1 FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = v_product_id
          AND (
            p.is_battery = TRUE OR
            p.name ILIKE '%battery%' OR
            p.name ILIKE '%batteries%'
          )
        ) INTO v_is_battery_sale;
        IF v_is_battery_sale THEN EXIT; END IF;
      END IF;
    END LOOP;

    IF v_is_battery_sale THEN
      v_ref_prefix := 'B';
    ELSE
      CASE UPPER(p_type)
        WHEN 'ON_HOLD' THEN v_ref_prefix := 'OH';
        WHEN 'CREDIT' THEN v_ref_prefix := 'CR';
        WHEN 'WARRANTY_CLAIM' THEN v_ref_prefix := 'WBX';
        WHEN 'STOCK_TRANSFER' THEN v_ref_prefix := 'ST';
        ELSE v_ref_prefix := 'A';
      END CASE;
    END IF;

    INSERT INTO reference_number_counters (prefix, counter, updated_at)
    VALUES (v_ref_prefix, 0, NOW())
    ON CONFLICT (prefix) DO UPDATE
    SET counter = reference_number_counters.counter + 1, updated_at = NOW()
    RETURNING counter INTO v_counter;

    IF v_counter = 0 THEN
      UPDATE reference_number_counters SET counter = 1, updated_at = NOW()
      WHERE prefix = v_ref_prefix AND counter = 0
      RETURNING counter INTO v_counter;
    END IF;

    v_reference_number := v_ref_prefix || LPAD(v_counter::TEXT, 4, '0');
  END IF;

  -- Process Items (Stock Deduction)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';

    IF NOT (v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') THEN
      CONTINUE;
    END IF;

    v_product_id := v_product_id_text::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC;
    v_item_source := COALESCE(v_item->>'source', 'CLOSED');
    v_volume_desc := v_item->>'volumeDescription';
    v_batch_deduction := 0;

    SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock
    INTO v_inventory_id, v_standard_stock, v_closed_bottles, v_open_bottles
    FROM inventory
    WHERE product_id = v_product_id AND location_id = p_location_id
    FOR UPDATE;

    IF v_inventory_id IS NULL THEN
      RAISE EXCEPTION 'Inventory record not found for product % at location %', v_product_id, p_location_id;
    END IF;

    -- Check if product is a lubricant (fluid)
    SELECT
      COALESCE(c.name IN ('Lubricants', 'Fluids', 'Additives'), FALSE),
      p.name,
      COALESCE(p.bottle_size, 0)
    INTO v_is_lubricant, v_product_name, v_bottle_size
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = v_product_id;

    IF v_is_lubricant AND v_item_source = 'OPEN' AND v_bottle_size > 0 THEN
      -- Open bottle handling for lubricants
      v_total_req_volume := v_quantity * v_bottle_size;
      v_remaining_qty := v_total_req_volume;

      -- Deduct from open bottles (smallest remaining first)
      FOR v_open_bottle IN
        SELECT id, remaining_volume
        FROM open_bottle_details
        WHERE inventory_id = v_inventory_id AND remaining_volume > 0
        ORDER BY remaining_volume ASC
      LOOP
        EXIT WHEN v_remaining_qty <= 0;

        v_new_open_vol := GREATEST(0, v_open_bottle.remaining_volume - v_remaining_qty);
        v_batch_deduction := LEAST(v_remaining_qty, v_open_bottle.remaining_volume);

        UPDATE open_bottle_details
        SET remaining_volume = v_new_open_vol
        WHERE id = v_open_bottle.id;

        v_remaining_qty := v_remaining_qty - v_batch_deduction;
      END LOOP;

      -- If still remaining, deduct from closed bottles
      IF v_remaining_qty > 0 THEN
        v_bottles_to_open := CEIL(v_remaining_qty / v_bottle_size)::INTEGER;
        IF v_closed_bottles < v_bottles_to_open THEN
          RAISE EXCEPTION 'Insufficient stock for % (need % closed bottles, have %)', v_product_name, v_bottles_to_open, v_closed_bottles;
        END IF;

        UPDATE inventory
        SET closed_bottles_stock = closed_bottles_stock - v_bottles_to_open
        WHERE id = v_inventory_id;

        -- Create new open bottle with residual
        v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_remaining_qty;
        IF v_residual_open_volume > 0 THEN
          INSERT INTO open_bottle_details (inventory_id, remaining_volume)
          VALUES (v_inventory_id, v_residual_open_volume);
        END IF;
      END IF;

      -- Always update standard stock for open bottle sales
      UPDATE inventory
      SET standard_stock = standard_stock - v_quantity
      WHERE id = v_inventory_id;

    ELSIF v_is_lubricant AND v_item_source = 'CLOSED' THEN
      -- Closed bottle handling
      IF v_closed_bottles < v_quantity THEN
        RAISE EXCEPTION 'Insufficient closed bottle stock for % (need %, have %)', v_product_name, v_quantity, v_closed_bottles;
      END IF;

      UPDATE inventory
      SET closed_bottles_stock = closed_bottles_stock - v_quantity,
          standard_stock = standard_stock - v_quantity
      WHERE id = v_inventory_id;

    ELSE
      -- Standard product handling (non-lubricant or non-fluid)
      IF v_standard_stock < v_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for % (need %, have %)', v_product_name, v_quantity, v_standard_stock;
      END IF;

      UPDATE inventory
      SET standard_stock = standard_stock - v_quantity
      WHERE id = v_inventory_id;
    END IF;

    -- FIFO Batch deduction
    v_remaining_qty := v_quantity;
    FOR v_batch IN
      SELECT id, current_quantity
      FROM batches
      WHERE inventory_id = v_inventory_id AND current_quantity > 0
      ORDER BY purchase_date ASC, id ASC
    LOOP
      EXIT WHEN v_remaining_qty <= 0;

      v_batch_alloc := LEAST(v_remaining_qty, v_batch.current_quantity);
      v_batch_remaining := v_batch.current_quantity - v_batch_alloc;

      UPDATE batches
      SET current_quantity = v_batch_remaining,
          is_active_batch = CASE WHEN v_batch_remaining = 0 THEN FALSE ELSE is_active_batch END
      WHERE id = v_batch.id;

      v_remaining_qty := v_remaining_qty - v_batch_alloc;
    END LOOP;
  END LOOP;

  -- Create Transaction Record
  INSERT INTO transactions (
    reference_number, location_id, shop_id, cashier_id, type,
    total_amount, items_sold, payment_method, car_plate_number,
    mobile_payment_account, mobile_number, customer_id,
    discount_type, discount_value, discount_amount, subtotal_before_discount,
    notes, created_at
  ) VALUES (
    v_reference_number, p_location_id, p_shop_id, p_cashier_id, p_type,
    p_total_amount, p_items, p_payment_method, p_car_plate_number,
    p_mobile_payment_account, p_mobile_number, p_customer_id,
    p_discount_type, p_discount_value, p_discount_amount, p_subtotal_before_discount,
    p_notes, NOW()
  ) RETURNING id INTO v_transaction_id;

  -- Populate service_items from cart items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id_text := v_item->>'productId';
    IF v_product_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      INSERT INTO service_items (transaction_id, item_type, product_id, name, quantity, unit_price, cost_price, volume_description, source)
      VALUES (v_transaction_id, 'product', v_product_id_text::UUID,
        COALESCE(v_item->>'volumeDescription', v_item->>'name', 'Unknown'),
        COALESCE((v_item->>'quantity')::NUMERIC, 1),
        COALESCE((v_item->>'sellingPrice')::NUMERIC, 0),
        COALESCE((v_item->>'costPrice')::NUMERIC, 0),
        v_item->>'volumeDescription', v_item->>'source');
    ELSE
      INSERT INTO service_items (transaction_id, item_type, name, quantity, unit_price, cost_price, volume_description)
      VALUES (v_transaction_id, 'labor',
        COALESCE(v_item->>'volumeDescription', v_item->>'name', 'Labor Service'),
        COALESCE((v_item->>'quantity')::NUMERIC, 1),
        COALESCE((v_item->>'sellingPrice')::NUMERIC, 0), 0,
        v_item->>'volumeDescription');
    END IF;
  END LOOP;

  -- Populate service_items and labor_splits from p_services
  IF p_services IS NOT NULL AND jsonb_array_length(p_services) > 0 THEN
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
    LOOP
      v_si_name := v_service->>'name';
      v_si_amount := (v_service->>'amount')::NUMERIC;
      v_si_quantity := COALESCE((v_service->>'quantity')::NUMERIC, 1);
      v_si_service_id := NULL;

      IF v_service->>'serviceId' IS NOT NULL AND v_service->>'serviceId' != '' THEN
        IF (v_service->>'serviceId') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
          v_si_service_id := (v_service->>'serviceId')::UUID;
        END IF;
      END IF;

      IF v_si_service_id IS NULL AND v_si_name IS NOT NULL THEN
        SELECT id INTO v_si_service_id FROM services
        WHERE lower(name) = lower(v_si_name) AND is_active = true LIMIT 1;
      END IF;

      v_service_category := 'service';
      IF v_si_service_id IS NOT NULL THEN
        SELECT category INTO v_service_category FROM services WHERE id = v_si_service_id;
      END IF;

      INSERT INTO service_items (transaction_id, item_type, service_id, name, quantity, unit_price, cost_price, notes)
      VALUES (v_transaction_id, COALESCE(v_service_category, 'service'), v_si_service_id,
        COALESCE(v_si_name, 'Custom Service'), v_si_quantity, v_si_amount, 0, v_service->>'description')
      RETURNING id INTO v_service_item_id;

      IF v_service->>'splits' IS NOT NULL AND jsonb_array_length((v_service->>'splits')::JSONB) > 0 THEN
        FOR v_labor_split IN SELECT * FROM jsonb_array_elements((v_service->>'splits')::JSONB)
        LOOP
          INSERT INTO labor_splits (service_item_id, staff_id, split_type, amount, percentage, description)
          VALUES (v_service_item_id,
            CASE WHEN v_labor_split->>'staffId' IS NOT NULL AND (v_labor_split->>'staffId') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
              THEN (v_labor_split->>'staffId')::UUID ELSE NULL END,
            COALESCE(v_labor_split->>'splitType', 'technician_share'),
            COALESCE((v_labor_split->>'amount')::NUMERIC, 0),
            (v_labor_split->>'percentage')::NUMERIC,
            v_labor_split->>'description');
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- Process Trade-Ins
  IF p_trade_ins IS NOT NULL AND jsonb_array_length(p_trade_ins) > 0 THEN
    SELECT id INTO v_parts_category_id FROM categories WHERE name = 'Parts' LIMIT 1;
    SELECT id INTO v_battery_type_id FROM types WHERE (name ILIKE 'Battery' OR name ILIKE 'Batteries') LIMIT 1;

    IF v_parts_category_id IS NOT NULL THEN
      FOR v_trade_in IN SELECT * FROM jsonb_array_elements(p_trade_ins)
      LOOP
        v_ti_size := v_trade_in->>'size';
        v_ti_condition := v_trade_in->>'condition';
        v_ti_name := v_trade_in->>'name';
        v_ti_cost_price := (v_trade_in->>'costPrice')::NUMERIC;
        v_ti_quantity := (v_trade_in->>'quantity')::INTEGER;
        v_ti_trade_in_value := (v_trade_in->>'tradeInValue')::NUMERIC;

        -- Find or create trade-in product
        SELECT id INTO v_ti_product_id FROM products
        WHERE name ILIKE '%' || v_ti_size || '%trade%' AND category_id = v_parts_category_id
        LIMIT 1;

        IF v_ti_product_id IS NULL THEN
          INSERT INTO products (name, category_id, type_id, cost_price, selling_price, is_active)
          VALUES ('Trade-In: ' || v_ti_size || ' (' || v_ti_condition || ')', v_parts_category_id, v_battery_type_id, v_ti_cost_price, v_ti_trade_in_value, true)
          RETURNING id INTO v_ti_product_id;
        END IF;

        -- Get or create inventory for trade-in product
        SELECT id INTO v_ti_inventory_id FROM inventory
        WHERE product_id = v_ti_product_id AND location_id = p_location_id;

        IF v_ti_inventory_id IS NULL THEN
          INSERT INTO inventory (product_id, location_id, standard_stock)
          VALUES (v_ti_product_id, p_location_id, 0)
          RETURNING id INTO v_ti_inventory_id;
        END IF;

        -- Add trade-in stock
        UPDATE inventory SET standard_stock = standard_stock + v_ti_quantity WHERE id = v_ti_inventory_id;

        -- Get selling price from product
        SELECT selling_price INTO v_ti_selling_price FROM products WHERE id = v_ti_product_id;

        -- Create batch for trade-in
        INSERT INTO batches (inventory_id, purchase_date, initial_quantity, current_quantity, cost_price, is_active_batch)
        VALUES (v_ti_inventory_id, CURRENT_DATE, v_ti_quantity, v_ti_quantity, v_ti_cost_price, true);
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;
$$;

COMMIT;