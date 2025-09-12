-- Complete database schema update for inventory system
-- Run this SQL script in your Supabase SQL editor or database client

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    CONSTRAINT categories_name_unique UNIQUE(name)
);

-- Create brands table if it doesn't exist
CREATE TABLE IF NOT EXISTS brands (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    CONSTRAINT brands_name_unique UNIQUE(name)
);

-- Create locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL
);

-- Ensure products table has all required fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id uuid;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturing_date timestamp with time zone;

-- Ensure inventory table has all required fields
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS location_id uuid;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS standard_stock integer DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS selling_price numeric;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS open_bottles_stock integer DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS closed_bottles_stock integer DEFAULT 0;

-- Create product_volumes table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_volumes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    volume_description text NOT NULL,
    selling_price numeric NOT NULL
);

-- Create batches table if it doesn't exist
CREATE TABLE IF NOT EXISTS batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    inventory_id uuid NOT NULL,
    cost_price numeric NOT NULL,
    quantity_received integer NOT NULL,
    stock_remaining integer NOT NULL,
    supplier text,
    purchase_date timestamp with time zone DEFAULT now(),
    is_active_batch boolean DEFAULT false
);

-- Add foreign key constraints
DO $$ 
BEGIN
    -- Products -> Categories
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_category_id_categories_id_fk'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_category_id_categories_id_fk 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE restrict;
    END IF;

    -- Products -> Brands
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_brand_id_brands_id_fk'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_brand_id_brands_id_fk 
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE set null ON UPDATE no action;
    END IF;

    -- Inventory -> Products
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_product_id_products_id_fk'
    ) THEN
        ALTER TABLE inventory 
        ADD CONSTRAINT inventory_product_id_products_id_fk 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE restrict;
    END IF;

    -- Inventory -> Locations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_location_id_locations_id_fk'
    ) THEN
        ALTER TABLE inventory 
        ADD CONSTRAINT inventory_location_id_locations_id_fk 
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE restrict;
    END IF;

    -- Product Volumes -> Products
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'product_volumes_product_id_products_id_fk'
    ) THEN
        ALTER TABLE product_volumes 
        ADD CONSTRAINT product_volumes_product_id_products_id_fk 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE cascade;
    END IF;

    -- Batches -> Inventory
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'batches_inventory_id_inventory_id_fk'
    ) THEN
        ALTER TABLE batches 
        ADD CONSTRAINT batches_inventory_id_inventory_id_fk 
        FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE cascade;
    END IF;
END $$;

-- Add generated column for total_stock in inventory table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory' AND column_name = 'total_stock'
    ) THEN
        ALTER TABLE inventory 
        ADD COLUMN total_stock integer GENERATED ALWAYS AS (
            COALESCE(standard_stock, 0) + COALESCE(open_bottles_stock, 0) + COALESCE(closed_bottles_stock, 0)
        ) STORED;
    END IF;
END $$;

-- Insert some default categories if they don't exist
INSERT INTO categories (name) VALUES 
    ('Lubricants'),
    ('Filters'), 
    ('Parts'),
    ('Additives & Fluids')
ON CONFLICT (name) DO NOTHING;

-- Insert some default brands if they don't exist
INSERT INTO brands (name) VALUES 
    ('Castrol'),
    ('Mobil'),
    ('Bosch'),
    ('K&N'),
    ('Toyota')
ON CONFLICT (name) DO NOTHING;
