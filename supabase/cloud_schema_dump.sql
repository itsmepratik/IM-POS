-- Cloud Supabase → Self-Hosted Migration Dump
-- Source: yswnbtmhjspgchautipr.supabase.co
-- Generated: 2026-08-31T05:39:55.486Z
-- NOTE: Run this on the self-hosted database to apply the schema

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE TYPE public.permission AS ENUM ('pos.access', 'inventory.access', 'customers.access', 'transactions.access', 'notifications.access', 'reports.access', 'settings.access', 'users.access', 'admin.access');

CREATE TYPE public.user_role AS ENUM ('admin', 'shop');

CREATE TABLE public.__drizzle_migrations (
  id integer NOT NULL DEFAULT nextval('__drizzle_migrations_id_seq'::regclass),
  hash text NOT NULL,
  created_at bigint,
  CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id)
);

CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  service_type text NOT NULL,
  appointment_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  notes text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id)
);

CREATE TABLE public.batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL,
  cost_price numeric NOT NULL,
  quantity_received integer NOT NULL,
  stock_remaining integer NOT NULL,
  supplier text,
  purchase_date timestamp with time zone DEFAULT now(),
  is_active_batch boolean DEFAULT false,
  batch_number integer DEFAULT 1,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT batches_pkey PRIMARY KEY (id)
);

CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

CREATE TABLE public.customer_vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year text NOT NULL,
  license_plate text NOT NULL,
  vin text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customer_vehicles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);

CREATE TABLE public.inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  location_id uuid NOT NULL,
  standard_stock integer DEFAULT 0,
  selling_price numeric,
  open_bottles_stock integer DEFAULT 0,
  closed_bottles_stock integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  total_stock integer GENERATED ALWAYS AS (COALESCE(standard_stock, 0)) STORED,
  CONSTRAINT inventory_pkey PRIMARY KEY (id)
);

CREATE TABLE public.labor_splits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_item_id uuid NOT NULL,
  staff_id uuid,
  split_type text NOT NULL,
  amount numeric NOT NULL,
  percentage numeric,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT labor_splits_pkey PRIMARY KEY (id)
);

CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT locations_pkey PRIMARY KEY (id)
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  type text DEFAULT 'info'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE TABLE public.open_bottle_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL,
  initial_volume numeric NOT NULL,
  current_volume numeric NOT NULL,
  opened_at timestamp with time zone DEFAULT now(),
  is_empty boolean DEFAULT false,
  CONSTRAINT open_bottle_details_pkey PRIMARY KEY (id)
);

CREATE TABLE public.product_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  type_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_types_pkey PRIMARY KEY (id)
);

CREATE TABLE public.product_volumes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  volume_description text NOT NULL,
  selling_price numeric NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_volumes_pkey PRIMARY KEY (id)
);

CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid NOT NULL,
  brand_id uuid,
  description text,
  image_url text,
  low_stock_threshold integer DEFAULT 0,
  cost_price numeric,
  manufacturing_date timestamp with time zone,
  is_battery boolean DEFAULT false,
  battery_state text,
  type_id uuid,
  bottle_size numeric,
  updated_at timestamp with time zone DEFAULT now(),
  specification text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

CREATE TABLE public.reference_number_counters (
  prefix text NOT NULL,
  counter integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reference_number_counters_pkey PRIMARY KEY (prefix)
);

CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role USER-DEFINED NOT NULL,
  permission USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id)
);

CREATE TABLE public.service_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  item_type text NOT NULL,
  product_id uuid,
  service_id uuid,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT '1'::numeric,
  unit_price numeric NOT NULL,
  cost_price numeric DEFAULT '0'::numeric,
  discount_amount numeric DEFAULT '0'::numeric,
  volume_description text,
  source text,
  batch_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT service_items_pkey PRIMARY KEY (id)
);

CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  description text,
  category text NOT NULL DEFAULT 'labor'::text,
  default_price numeric,
  estimated_duration_minutes integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id)
);

CREATE TABLE public.shops (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_id uuid NOT NULL,
  display_name text,
  pos_id text,
  shop_code text DEFAULT '01'::text,
  zip_code text DEFAULT '319'::text,
  brand_whatsapp text,
  supervisor_password_hash text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  company_name text,
  company_name_arabic text,
  cr_number text,
  address_line_1 text,
  address_line_2 text,
  address_line_3 text,
  contact_number text,
  service_description_en text,
  service_description_ar text,
  thank_you_message text,
  brand_name text,
  brand_address text,
  brand_phones text,
  address_line_arabic_1 text,
  address_line_arabic_2 text,
  contact_number_arabic text,
  thank_you_message_ar text,
  CONSTRAINT shops_pkey PRIMARY KEY (id)
);

CREATE TABLE public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id text NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  email text,
  phone text,
  role text NOT NULL DEFAULT 'staff'::text,
  salary numeric,
  hire_date timestamp with time zone,
  date_of_birth timestamp with time zone,
  address text,
  national_id text,
  emergency_contact text,
  emergency_phone text,
  profile_image_url text,
  shop_id uuid,
  notes text,
  CONSTRAINT staff_pkey PRIMARY KEY (id)
);

CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text,
  email text,
  phone text,
  address text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);

CREATE TABLE public.trade_in_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  size text NOT NULL,
  condition text NOT NULL,
  trade_in_value numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT trade_in_prices_pkey PRIMARY KEY (id)
);

CREATE TABLE public.trade_in_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  trade_in_value numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT trade_in_transactions_pkey PRIMARY KEY (id)
);

CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reference_number text NOT NULL,
  location_id uuid NOT NULL,
  shop_id uuid,
  cashier_id text,
  type text NOT NULL,
  total_amount numeric NOT NULL,
  items_sold jsonb,
  payment_method text,
  car_plate_number text,
  mobile_payment_account text,
  mobile_number text,
  receipt_html text,
  battery_bill_html text,
  original_reference_number text,
  customer_id uuid,
  notes text,
  discount_type text,
  discount_value numeric,
  discount_amount numeric,
  subtotal_before_discount numeric,
  is_voided boolean DEFAULT false,
  voided_at timestamp with time zone,
  voided_by_staff_id uuid,
  void_reason text,
  created_at timestamp with time zone DEFAULT now(),
  cashier_id_uuid uuid,
  CONSTRAINT transactions_pkey PRIMARY KEY (id)
);

CREATE TABLE public.types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT types_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  role USER-DEFINED DEFAULT 'shop'::user_role,
  is_admin boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  shop_location_id uuid,
  inventory_location_id uuid,
  shop_display_name text,
  shop_id uuid,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.vehicle_filters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  filter_part_number text NOT NULL,
  filter_type text DEFAULT 'oil'::text,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT vehicle_filters_pkey PRIMARY KEY (id)
);

CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  engine text NOT NULL,
  oil_capacity numeric(4, 1) NOT NULL,
  oil_filter_part_number text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT vehicles_pkey PRIMARY KEY (id)
);

ALTER TABLE public.batches ADD CONSTRAINT batches_inventory_id_inventory_id_fk FOREIGN KEY (inventory_id) REFERENCES public.inventory(id);
ALTER TABLE public.customer_vehicles ADD CONSTRAINT customer_vehicles_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE public.inventory ADD CONSTRAINT inventory_location_id_locations_id_fk FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE public.inventory ADD CONSTRAINT inventory_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE public.labor_splits ADD CONSTRAINT labor_splits_service_item_id_service_items_id_fk FOREIGN KEY (service_item_id) REFERENCES public.service_items(id);
ALTER TABLE public.labor_splits ADD CONSTRAINT labor_splits_staff_id_staff_id_fk FOREIGN KEY (staff_id) REFERENCES public.staff(id);
ALTER TABLE public.open_bottle_details ADD CONSTRAINT open_bottle_details_inventory_id_inventory_id_fk FOREIGN KEY (inventory_id) REFERENCES public.inventory(id);
ALTER TABLE public.product_types ADD CONSTRAINT product_types_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE public.product_types ADD CONSTRAINT product_types_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(id);
ALTER TABLE public.product_volumes ADD CONSTRAINT product_volumes_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE public.products ADD CONSTRAINT products_brand_id_brands_id_fk FOREIGN KEY (brand_id) REFERENCES public.brands(id);
ALTER TABLE public.products ADD CONSTRAINT products_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);
ALTER TABLE public.products ADD CONSTRAINT products_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(id);
ALTER TABLE public.service_items ADD CONSTRAINT service_items_batch_id_batches_id_fk FOREIGN KEY (batch_id) REFERENCES public.batches(id);
ALTER TABLE public.service_items ADD CONSTRAINT service_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE public.service_items ADD CONSTRAINT service_items_service_id_services_id_fk FOREIGN KEY (service_id) REFERENCES public.services(id);
ALTER TABLE public.service_items ADD CONSTRAINT service_items_transaction_id_transactions_id_fk FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);
ALTER TABLE public.shops ADD CONSTRAINT shops_location_id_locations_id_fk FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE public.staff ADD CONSTRAINT staff_shop_id_shops_id_fk FOREIGN KEY (shop_id) REFERENCES public.shops(id);
ALTER TABLE public.trade_in_transactions ADD CONSTRAINT trade_in_transactions_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE public.trade_in_transactions ADD CONSTRAINT trade_in_transactions_transaction_id_transactions_id_fk FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_location_id_locations_id_fk FOREIGN KEY (location_id) REFERENCES public.locations(id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_shop_id_shops_id_fk FOREIGN KEY (shop_id) REFERENCES public.shops(id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_voided_by_staff_id_staff_id_fk FOREIGN KEY (voided_by_staff_id) REFERENCES public.staff(id);
ALTER TABLE public.types ADD CONSTRAINT types_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_inventory_location_id_fkey FOREIGN KEY (inventory_location_id) REFERENCES public.locations(id);
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id);
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_shop_location_id_fkey FOREIGN KEY (shop_location_id) REFERENCES public.locations(id);
ALTER TABLE public.vehicle_filters ADD CONSTRAINT vehicle_filters_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);

ALTER TABLE public.brands ADD CONSTRAINT brands_name_unique UNIQUE (name);
ALTER TABLE public.categories ADD CONSTRAINT categories_name_unique UNIQUE (name);
ALTER TABLE public.product_types ADD CONSTRAINT product_types_product_id_type_id_key UNIQUE (product_id,type_id);
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_permission_key UNIQUE (role,permission);
ALTER TABLE public.staff ADD CONSTRAINT staff_staff_id_unique UNIQUE (staff_id);
ALTER TABLE public.trade_in_prices ADD CONSTRAINT trade_in_prices_size_condition_unique UNIQUE (size,condition);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_reference_number_unique UNIQUE (reference_number);
ALTER TABLE public.types ADD CONSTRAINT types_category_id_name_unique UNIQUE (category_id,name);
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);
ALTER TABLE public.vehicle_filters ADD CONSTRAINT vehicle_filters_unique UNIQUE (vehicle_id,filter_part_number);
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_make_model_year_engine_key UNIQUE (make,model,year,engine);

CREATE INDEX batches_inventory_active_idx ON public.batches USING btree (inventory_id, is_active_batch);
CREATE UNIQUE INDEX brands_name_unique ON public.brands USING btree (name);
CREATE UNIQUE INDEX categories_name_unique ON public.categories USING btree (name);
CREATE INDEX customers_name_lower_idx ON public.customers USING btree (lower(name));
CREATE INDEX customers_phone_idx ON public.customers USING btree (phone);
CREATE INDEX idx_batches_inventory_batch_number ON public.batches USING btree (inventory_id, batch_number);
CREATE INDEX idx_brands_name ON public.brands USING btree (name);
CREATE INDEX idx_customer_vehicles_customer_id ON public.customer_vehicles USING btree (customer_id);
CREATE INDEX idx_customer_vehicles_make_model ON public.customer_vehicles USING btree (make, model);
CREATE INDEX idx_customers_created_at ON public.customers USING btree (created_at);
CREATE INDEX idx_customers_email ON public.customers USING btree (email);
CREATE INDEX idx_customers_name ON public.customers USING btree (name);
CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);
CREATE INDEX idx_inventory_location_id ON public.inventory USING btree (location_id);
CREATE INDEX idx_inventory_product_id ON public.inventory USING btree (product_id);
CREATE INDEX idx_inventory_product_location ON public.inventory USING btree (product_id, location_id);
CREATE INDEX idx_open_bottle_details_inventory_id ON public.open_bottle_details USING btree (inventory_id);
CREATE INDEX idx_open_bottle_details_is_empty ON public.open_bottle_details USING btree (is_empty);
CREATE INDEX idx_open_bottle_details_opened_at ON public.open_bottle_details USING btree (opened_at);
CREATE INDEX idx_product_volumes_product_id ON public.product_volumes USING btree (product_id);
CREATE INDEX idx_products_brand_id ON public.products USING btree (brand_id);
CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);
CREATE INDEX idx_products_is_battery_battery_state ON public.products USING btree (is_battery, battery_state) WHERE (is_battery = true);
CREATE INDEX idx_products_type_id ON public.products USING btree (type_id);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission);
CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role);
CREATE INDEX idx_transactions_notes ON public.transactions USING btree (notes);
CREATE INDEX idx_types_category_id ON public.types USING btree (category_id);
CREATE INDEX idx_types_name ON public.types USING btree (name);
CREATE INDEX idx_user_profiles_email ON public.user_profiles USING btree (email);
CREATE INDEX idx_user_profiles_inventory_location_id ON public.user_profiles USING btree (inventory_location_id);
CREATE INDEX idx_user_profiles_role ON public.user_profiles USING btree (role);
CREATE INDEX idx_user_profiles_shop_location_id ON public.user_profiles USING btree (shop_location_id);
CREATE INDEX idx_vehicle_filters_part_number ON public.vehicle_filters USING btree (filter_part_number);
CREATE INDEX idx_vehicle_filters_vehicle_id ON public.vehicle_filters USING btree (vehicle_id);
CREATE INDEX inventory_product_location_idx ON public.inventory USING btree (product_id, location_id);
CREATE INDEX labor_splits_service_item_idx ON public.labor_splits USING btree (service_item_id);
CREATE INDEX labor_splits_staff_idx ON public.labor_splits USING btree (staff_id);
CREATE INDEX open_bottle_details_inventory_empty_idx ON public.open_bottle_details USING btree (inventory_id, is_empty);
CREATE UNIQUE INDEX product_types_product_id_type_id_key ON public.product_types USING btree (product_id, type_id);
CREATE INDEX product_volumes_product_idx ON public.product_volumes USING btree (product_id);
CREATE INDEX products_brand_idx ON public.products USING btree (brand_id);
CREATE INDEX products_category_idx ON public.products USING btree (category_id);
CREATE INDEX products_name_lower_idx ON public.products USING btree (lower(name));
CREATE UNIQUE INDEX role_permissions_role_permission_key ON public.role_permissions USING btree (role, permission);
CREATE INDEX service_items_product_idx ON public.service_items USING btree (product_id);
CREATE INDEX service_items_service_idx ON public.service_items USING btree (service_id);
CREATE INDEX service_items_transaction_idx ON public.service_items USING btree (transaction_id);
CREATE INDEX service_items_type_idx ON public.service_items USING btree (item_type);
CREATE INDEX services_category_idx ON public.services USING btree (category);
CREATE INDEX services_name_lower_idx ON public.services USING btree (lower(name));
CREATE INDEX staff_email_idx ON public.staff USING btree (email);
CREATE INDEX staff_role_idx ON public.staff USING btree (role);
CREATE INDEX staff_shop_idx ON public.staff USING btree (shop_id);
CREATE UNIQUE INDEX staff_staff_id_unique ON public.staff USING btree (staff_id);
CREATE UNIQUE INDEX trade_in_prices_size_condition_unique ON public.trade_in_prices USING btree (size, condition);
CREATE INDEX transactions_customer_idx ON public.transactions USING btree (customer_id);
CREATE INDEX transactions_date_idx ON public.transactions USING btree (created_at);
CREATE INDEX transactions_ref_idx ON public.transactions USING btree (reference_number);
CREATE UNIQUE INDEX transactions_reference_number_unique ON public.transactions USING btree (reference_number);
CREATE INDEX transactions_shop_idx ON public.transactions USING btree (shop_id);
CREATE UNIQUE INDEX types_category_id_name_unique ON public.types USING btree (category_id, name);
CREATE UNIQUE INDEX user_profiles_email_key ON public.user_profiles USING btree (email);
CREATE UNIQUE INDEX vehicle_filters_unique ON public.vehicle_filters USING btree (vehicle_id, filter_part_number);
CREATE UNIQUE INDEX vehicles_make_model_year_engine_key ON public.vehicles USING btree (make, model, year, engine);
CREATE INDEX vehicles_plate_lower_idx ON public.customer_vehicles USING btree (lower(license_plate));

CREATE OR REPLACE VIEW public.user_info AS
 SELECT id,
    email,
    full_name,
    role,
    shop_location_id,
    inventory_location_id,
    shop_display_name,
    created_at,
    updated_at
   FROM user_profiles;;

CREATE SEQUENCE IF NOT EXISTS public.__drizzle_migrations_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.cleanup_old_batches(p_keep_count integer DEFAULT 5) RETURNS integer VOLATILE LANGUAGE plpgsql AS $$

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

$$;

CREATE OR REPLACE FUNCTION public.create_checkout_transaction(p_location_id uuid, p_shop_id uuid, p_cashier_id uuid, p_items jsonb, p_total_amount numeric, p_payment_method text, p_type text, p_customer_id uuid DEFAULT NULL::uuid, p_discount_value numeric DEFAULT NULL::numeric, p_discount_type text DEFAULT NULL::text, p_discount_amount numeric DEFAULT NULL::numeric, p_subtotal_before_discount numeric DEFAULT NULL::numeric, p_car_plate_number text DEFAULT NULL::text, p_mobile_payment_account text DEFAULT NULL::text, p_mobile_number text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_trade_ins jsonb DEFAULT NULL::jsonb, p_reference_number text DEFAULT NULL::text, p_services jsonb DEFAULT NULL::jsonb) RETURNS jsonb VOLATILE SECURITY DEFINER LANGUAGE plpgsql AS $$

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
      -- ================================================================
      -- OPEN branch: consume from existing open bottles first,
      -- then open new closed bottles if needed
      -- ================================================================

      v_sold_volume_per_unit := (substring(v_volume_desc from '(^[0-9]+(\.[0-9]+)?)'))::NUMERIC;
      IF v_sold_volume_per_unit IS NULL OR v_sold_volume_per_unit = 0 THEN
        v_sold_volume_per_unit := v_bottle_size;
      END IF;

      IF v_volume_desc ~* 'ml' AND v_sold_volume_per_unit > 1 THEN
        v_sold_volume_per_unit := v_sold_volume_per_unit / 1000.0;
      END IF;

      v_total_req_volume := v_sold_volume_per_unit * v_quantity;
      v_remaining_qty := v_total_req_volume;

      -- Deduct from open bottles (smallest remaining first)
      FOR v_open_bottle IN
        SELECT id, current_volume
        FROM open_bottle_details
        WHERE inventory_id = v_inventory_id AND current_volume > 0 AND is_empty = FALSE
        ORDER BY current_volume ASC
      LOOP
        EXIT WHEN v_remaining_qty <= 0;

        v_new_open_vol := GREATEST(0, v_open_bottle.current_volume - v_remaining_qty);
        v_batch_deduction := LEAST(v_remaining_qty, v_open_bottle.current_volume);

        UPDATE open_bottle_details
        SET current_volume = v_new_open_vol,
            is_empty = (v_new_open_vol <= 0)
        WHERE id = v_open_bottle.id;

        -- If the bottle just became empty, decrement open count and total stock
        IF v_new_open_vol <= 0 THEN
          v_open_bottles := v_open_bottles - 1;
          v_standard_stock := v_standard_stock - 1;
        END IF;

        v_remaining_qty := v_remaining_qty - v_batch_deduction;
      END LOOP;

      -- If still remaining, open new closed bottles
      IF v_remaining_qty > 0 THEN
        v_bottles_to_open := CEIL(v_remaining_qty / v_bottle_size)::INTEGER;
        IF v_closed_bottles < v_bottles_to_open THEN
          RAISE EXCEPTION 'Insufficient stock for % (need % closed bottles, have %)', v_product_name, v_bottles_to_open, v_closed_bottles;
        END IF;

        v_closed_bottles := v_closed_bottles - v_bottles_to_open;
        v_open_bottles := v_open_bottles + v_bottles_to_open;
        -- standard_stock unchanged: total bottles the same, just moved from closed to open

        v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_remaining_qty;
        IF v_residual_open_volume > 0 THEN
          INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
          VALUES (v_inventory_id, v_bottle_size, v_residual_open_volume, FALSE, NOW());
        END IF;
      END IF;

      UPDATE inventory
      SET standard_stock = v_standard_stock,
          closed_bottles_stock = v_closed_bottles,
          open_bottles_stock = v_open_bottles
      WHERE id = v_inventory_id;

    ELSIF v_is_lubricant AND v_item_source = 'CLOSED' AND v_bottle_size > 0 THEN
      -- ================================================================
      -- CLOSED branch: open new bottles, track residual.
      -- standard_stock unchanged (bottles move from closed to open).
      -- ================================================================

      v_sold_volume_per_unit := (substring(v_volume_desc from '(^[0-9]+(\.[0-9]+)?)'))::NUMERIC;
      IF v_sold_volume_per_unit IS NULL OR v_sold_volume_per_unit = 0 THEN
        v_sold_volume_per_unit := v_bottle_size;
      END IF;

      IF v_volume_desc ~* 'ml' AND v_sold_volume_per_unit > 1 THEN
        v_sold_volume_per_unit := v_sold_volume_per_unit / 1000.0;
      END IF;

      v_total_req_volume := v_sold_volume_per_unit * v_quantity;
      v_remaining_qty := v_total_req_volume;

      IF v_remaining_qty > 0 THEN
        v_bottles_to_open := CEIL(v_remaining_qty / v_bottle_size)::INTEGER;
        IF v_closed_bottles < v_bottles_to_open THEN
          RAISE EXCEPTION 'Insufficient closed bottle stock for % (need %, have %)', v_product_name, v_bottles_to_open, v_closed_bottles;
        END IF;

        v_closed_bottles := v_closed_bottles - v_bottles_to_open;
        v_open_bottles := v_open_bottles + v_bottles_to_open;
        -- standard_stock unchanged: total bottle count stays the same

        v_residual_open_volume := (v_bottles_to_open * v_bottle_size) - v_remaining_qty;
        IF v_residual_open_volume > 0 THEN
          INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
          VALUES (v_inventory_id, v_bottle_size, v_residual_open_volume, FALSE, NOW());
        END IF;
      END IF;

      UPDATE inventory
      SET standard_stock = v_standard_stock,  -- unchanged (total bottle count)
          closed_bottles_stock = v_closed_bottles,
          open_bottles_stock = v_open_bottles
      WHERE id = v_inventory_id;

    ELSE
      -- Standard product handling (non-lubricant or non-fluid)
      IF v_standard_stock < v_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for % (need %, have %)', v_product_name, v_quantity, v_standard_stock;
      END IF;

      UPDATE inventory
      SET standard_stock = v_standard_stock - v_quantity
      WHERE id = v_inventory_id;
    END IF;

    -- FIFO Batch deduction
    v_remaining_qty := v_quantity;
    FOR v_batch IN
      SELECT id, stock_remaining
      FROM batches
      WHERE inventory_id = v_inventory_id AND stock_remaining > 0
      ORDER BY purchase_date ASC, id ASC
    LOOP
      EXIT WHEN v_remaining_qty <= 0;

      v_batch_alloc := LEAST(v_remaining_qty, v_batch.stock_remaining);
      v_batch_remaining := v_batch.stock_remaining - v_batch_alloc;

      UPDATE batches
      SET stock_remaining = v_batch_remaining,
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

        SELECT id INTO v_ti_product_id FROM products
        WHERE name ILIKE '%' || v_ti_size || '%trade%' AND category_id = v_parts_category_id
        LIMIT 1;

        IF v_ti_product_id IS NULL THEN
          INSERT INTO products (name, category_id, type_id, cost_price, description, is_battery)
          VALUES ('Trade-In: ' || v_ti_size || ' (' || v_ti_condition || ')', v_parts_category_id, v_battery_type_id, v_ti_cost_price, 'Trade-in battery - ' || v_ti_size || ' (' || v_ti_condition || ')', true)
          RETURNING id INTO v_ti_product_id;
        END IF;

        SELECT id INTO v_ti_inventory_id FROM inventory
        WHERE product_id = v_ti_product_id AND location_id = p_location_id;

        IF v_ti_inventory_id IS NULL THEN
          INSERT INTO inventory (product_id, location_id, standard_stock)
          VALUES (v_ti_product_id, p_location_id, 0)
          RETURNING id INTO v_ti_inventory_id;
        END IF;

        UPDATE inventory SET standard_stock = standard_stock + v_ti_quantity WHERE id = v_ti_inventory_id;

        INSERT INTO batches (inventory_id, quantity_received, stock_remaining, cost_price, purchase_date, is_active_batch, batch_number, supplier)
        VALUES (v_ti_inventory_id, v_ti_quantity, v_ti_quantity, v_ti_cost_price, CURRENT_DATE, true, 1, 'Trade-in (' || v_ti_condition || ')');
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'reference_number', v_reference_number
  );
END;

$$;

CREATE OR REPLACE FUNCTION public.get_daily_payment_metrics(query_date timestamp with time zone DEFAULT now(), target_shop_id uuid DEFAULT NULL::uuid) RETURNS TABLE(payment_method text, total_amount numeric, transaction_count bigint) VOLATILE SECURITY DEFINER LANGUAGE plpgsql AS $$

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

$$;

CREATE OR REPLACE FUNCTION public.get_daily_sales(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid) RETURNS TABLE(sale_date date, total_sales numeric) VOLATILE LANGUAGE plpgsql AS $$

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

$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_profits_estimate(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid) RETURNS numeric VOLATILE AS $$

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

$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_top_items(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid) RETURNS TABLE(name text, units bigint, revenue numeric) VOLATILE AS $$

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

$$;

CREATE OR REPLACE FUNCTION public.get_net_revenue(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid) RETURNS numeric VOLATILE AS $$

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

$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_with_permissions(user_id uuid) RETURNS jsonb VOLATILE SECURITY DEFINER LANGUAGE plpgsql AS $$

    DECLARE
      profile_rec RECORD;
      result jsonb;
    BEGIN
      SELECT id, email, full_name, role, is_admin, shop_id, shop_location_id, inventory_location_id, shop_display_name
      INTO profile_rec
      FROM user_profiles
      WHERE id = user_id;

      IF NOT FOUND THEN
        RETURN jsonb_build_object('profile', NULL, 'permissions', '[]'::jsonb);
      END IF;

      result := jsonb_build_object(
        'profile', jsonb_build_object(
          'id', profile_rec.id,
          'email', profile_rec.email,
          'full_name', profile_rec.full_name,
          'role', profile_rec.role,
          'is_admin', profile_rec.is_admin,
          'shop_id', profile_rec.shop_id,
          'shop_location_id', profile_rec.shop_location_id,
          'inventory_location_id', profile_rec.inventory_location_id,
          'shop_display_name', profile_rec.shop_display_name
        ),
        'permissions', CASE
          WHEN profile_rec.role = 'admin' THEN
            '["pos.access","inventory.access","customers.access","transactions.access","notifications.access","reports.access","settings.access","users.access","appointments.access","admin.access"]'::jsonb
          ELSE
            '["pos.access","inventory.access","customers.access","transactions.access","notifications.access"]'::jsonb
        END
      );

      RETURN result;
    END;
    
$$;

CREATE OR REPLACE FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) RETURNS internal IMMUTABLE LANGUAGE c AS $$
gin_extract_query_trgm
$$;

CREATE OR REPLACE FUNCTION public.gin_extract_value_trgm(text, internal) RETURNS internal IMMUTABLE LANGUAGE c AS $$
gin_extract_value_trgm
$$;

CREATE OR REPLACE FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) RETURNS boolean IMMUTABLE LANGUAGE c AS $$
gin_trgm_consistent
$$;

CREATE OR REPLACE FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) RETURNS "char" IMMUTABLE LANGUAGE c AS $$
gin_trgm_triconsistent
$$;

CREATE OR REPLACE FUNCTION public.gtrgm_compress(internal) RETURNS internal IMMUTABLE LANGUAGE c AS $$
gtrgm_compress
$$;

CREATE OR REPLACE FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) RETURNS boolean IMMUTABLE LANGUAGE c AS $$
gtrgm_consistent
$$;

CREATE OR REPLACE FUNCTION public.gtrgm_decompress(internal) RETURNS internal IMMUTABLE LANGUAGE c AS $$
gtrgm_decompress
$$;

CREATE OR REPLACE FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) RETURNS double precision IMMUTABLE LANGUAGE c AS $$
gtrgm_distance
$$;

CREATE OR REPLACE FUNCTION public.gtrgm_in(cstring) RETURNS gtrgm IMMUTABLE LANGUAGE c AS $$
gtrgm_in
$$;

CREATE OR REPLACE FUNCTION public.gtrgm_options(internal) RETURNS void IMMUTABLE LANGUAGE c AS $$
gtrgm_options
$$;

CREATE OR REPLACE FUNCTION public.gtrgm_out(gtrgm) RETURNS cstring IMMUTABLE LANGUAGE c AS $$
gtrgm_out
$$;

CREATE OR REPLACE FUNCTION public.gtrgm_penalty(internal, internal, internal) RETURNS internal IMMUTABLE LANGUAGE c AS $$
gtrgm_penalty
$$;

CREATE OR REPLACE FUNCTION public.gtrgm_picksplit(internal, internal) RETURNS internal IMMUTABLE LANGUAGE c AS $$
gtrgm_picksplit
$$;

CREATE OR REPLACE FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal) RETURNS internal IMMUTABLE LANGUAGE c AS $$
gtrgm_same
$$;

CREATE OR REPLACE FUNCTION public.gtrgm_union(internal, internal) RETURNS gtrgm IMMUTABLE LANGUAGE c AS $$
gtrgm_union
$$;

CREATE OR REPLACE FUNCTION public.search_inventory_items_v2(p_search_query text, p_location_id uuid, p_category_id uuid DEFAULT NULL::uuid, p_brand_id uuid DEFAULT NULL::uuid, p_min_price numeric DEFAULT NULL::numeric, p_max_price numeric DEFAULT NULL::numeric, p_stock_status text DEFAULT 'all'::text, p_is_battery boolean DEFAULT NULL::boolean, p_battery_state text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(inventory_id uuid, product_id uuid, standard_stock integer, selling_price numeric, open_bottles_stock integer, closed_bottles_stock integer, total_stock integer, product_name text, product_description text, product_image_url text, product_low_stock_threshold integer, product_cost_price numeric, product_manufacturing_date timestamp with time zone, product_is_battery boolean, product_battery_state text, product_specification text, category_id uuid, category_name text, brand_id uuid, brand_name text, search_rank real, total_count bigint) VOLATILE SECURITY DEFINER LANGUAGE plpgsql AS $$

DECLARE
  v_search_tsquery tsquery;
  v_total_count BIGINT;
BEGIN
  v_search_tsquery := websearch_to_tsquery('simple', unaccent(p_search_query));

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

CREATE OR REPLACE FUNCTION public.set_batch_number() RETURNS trigger VOLATILE LANGUAGE plpgsql AS $$

BEGIN
  SELECT COALESCE(MAX(batch_number), 0) + 1 INTO NEW.batch_number
  FROM batches WHERE inventory_id = NEW.inventory_id;
  RETURN NEW;
END;

$$;

CREATE OR REPLACE FUNCTION public.set_limit(real) RETURNS real VOLATILE LANGUAGE c AS $$
set_limit
$$;

CREATE OR REPLACE FUNCTION public.show_limit() RETURNS real STABLE LANGUAGE c AS $$
show_limit
$$;

CREATE OR REPLACE FUNCTION public.show_trgm(text) RETURNS text[] IMMUTABLE LANGUAGE c AS $$
show_trgm
$$;

CREATE OR REPLACE FUNCTION public.similarity(text, text) RETURNS real IMMUTABLE LANGUAGE c AS $$
similarity
$$;

CREATE OR REPLACE FUNCTION public.similarity_dist(text, text) RETURNS real IMMUTABLE LANGUAGE c AS $$
similarity_dist
$$;

CREATE OR REPLACE FUNCTION public.similarity_op(text, text) RETURNS boolean STABLE LANGUAGE c AS $$
similarity_op
$$;

CREATE OR REPLACE FUNCTION public.strict_word_similarity(text, text) RETURNS real IMMUTABLE LANGUAGE c AS $$
strict_word_similarity
$$;

CREATE OR REPLACE FUNCTION public.strict_word_similarity_commutator_op(text, text) RETURNS boolean STABLE LANGUAGE c AS $$
strict_word_similarity_commutator_op
$$;

CREATE OR REPLACE FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) RETURNS real IMMUTABLE LANGUAGE c AS $$
strict_word_similarity_dist_commutator_op
$$;

CREATE OR REPLACE FUNCTION public.strict_word_similarity_dist_op(text, text) RETURNS real IMMUTABLE LANGUAGE c AS $$
strict_word_similarity_dist_op
$$;

CREATE OR REPLACE FUNCTION public.strict_word_similarity_op(text, text) RETURNS boolean STABLE LANGUAGE c AS $$
strict_word_similarity_op
$$;

CREATE OR REPLACE FUNCTION public.sync_inventory_from_batches() RETURNS trigger VOLATILE LANGUAGE plpgsql AS $$

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

$$;

CREATE OR REPLACE FUNCTION public.sync_inventory_from_batches_and_open_bottles() RETURNS trigger VOLATILE LANGUAGE plpgsql AS $$

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

$$;

CREATE OR REPLACE FUNCTION public.sync_inventory_from_open_bottles() RETURNS trigger VOLATILE LANGUAGE plpgsql AS $$

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

$$;

CREATE OR REPLACE FUNCTION public.sync_inventory_open_bottles_stock() RETURNS trigger VOLATILE LANGUAGE plpgsql AS $$

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

$$;

CREATE OR REPLACE FUNCTION public.unaccent(text) RETURNS text STABLE LANGUAGE c AS $$
unaccent_dict
$$;

CREATE OR REPLACE FUNCTION public.unaccent(regdictionary, text) RETURNS text STABLE LANGUAGE c AS $$
unaccent_dict
$$;

CREATE OR REPLACE FUNCTION public.unaccent_init(internal) RETURNS internal VOLATILE LANGUAGE c AS $$
unaccent_init
$$;

CREATE OR REPLACE FUNCTION public.unaccent_lexize(internal, internal, internal, internal) RETURNS internal VOLATILE LANGUAGE c AS $$
unaccent_lexize
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger VOLATILE LANGUAGE plpgsql AS $$

BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;

$$;

CREATE OR REPLACE FUNCTION public.word_similarity(text, text) RETURNS real IMMUTABLE LANGUAGE c AS $$
word_similarity
$$;

CREATE OR REPLACE FUNCTION public.word_similarity_commutator_op(text, text) RETURNS boolean STABLE LANGUAGE c AS $$
word_similarity_commutator_op
$$;

CREATE OR REPLACE FUNCTION public.word_similarity_dist_commutator_op(text, text) RETURNS real IMMUTABLE LANGUAGE c AS $$
word_similarity_dist_commutator_op
$$;

CREATE OR REPLACE FUNCTION public.word_similarity_dist_op(text, text) RETURNS real IMMUTABLE LANGUAGE c AS $$
word_similarity_dist_op
$$;

CREATE OR REPLACE FUNCTION public.word_similarity_op(text, text) RETURNS boolean STABLE LANGUAGE c AS $$
word_similarity_op
$$;

CREATE TRIGGER tr_set_batch_number BEFORE INSERT ON public.batches FOR EACH ROW EXECUTE FUNCTION set_batch_number();
CREATE TRIGGER tr_sync_inventory_from_batches AFTER UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION sync_inventory_from_batches();
CREATE TRIGGER tr_sync_inventory_from_batches AFTER DELETE ON public.batches FOR EACH ROW EXECUTE FUNCTION sync_inventory_from_batches();
CREATE TRIGGER tr_sync_inventory_from_batches AFTER INSERT ON public.batches FOR EACH ROW EXECUTE FUNCTION sync_inventory_from_batches();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_vehicles_updated_at BEFORE UPDATE ON public.customer_vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_sync_inventory_from_open_bottles AFTER DELETE ON public.open_bottle_details FOR EACH ROW EXECUTE FUNCTION sync_inventory_from_open_bottles();
CREATE TRIGGER tr_sync_inventory_from_open_bottles AFTER UPDATE ON public.open_bottle_details FOR EACH ROW EXECUTE FUNCTION sync_inventory_from_open_bottles();
CREATE TRIGGER tr_sync_inventory_from_open_bottles AFTER INSERT ON public.open_bottle_details FOR EACH ROW EXECUTE FUNCTION sync_inventory_from_open_bottles();
CREATE TRIGGER trg_sync_inventory_open_bottles_stock AFTER UPDATE ON public.open_bottle_details FOR EACH ROW EXECUTE FUNCTION sync_inventory_open_bottles_stock();
CREATE TRIGGER trg_sync_inventory_open_bottles_stock AFTER INSERT ON public.open_bottle_details FOR EACH ROW EXECUTE FUNCTION sync_inventory_open_bottles_stock();
CREATE TRIGGER trg_sync_inventory_open_bottles_stock AFTER DELETE ON public.open_bottle_details FOR EACH ROW EXECUTE FUNCTION sync_inventory_open_bottles_stock();
CREATE TRIGGER update_product_volumes_updated_at BEFORE UPDATE ON public.product_volumes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.customer_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_bottle_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY Allow all operations for authenticated users ON public.customer_vehicles AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY Allow all operations for authenticated users ON public.customers AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY Authenticated users can delete labor splits ON public.labor_splits AS PERMISSIVE FOR DELETE TO authenticated USING (true);
CREATE POLICY Authenticated users can insert labor splits ON public.labor_splits AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY Authenticated users can update labor splits ON public.labor_splits AS PERMISSIVE FOR UPDATE TO authenticated USING (true);
CREATE POLICY Authenticated users can view labor splits ON public.labor_splits AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY Users can create open bottle details ON public.open_bottle_details AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY Users can delete open bottle details ON public.open_bottle_details AS PERMISSIVE FOR DELETE TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY Users can update open bottle details ON public.open_bottle_details AS PERMISSIVE FOR UPDATE TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY Users can view open bottle details ON public.open_bottle_details AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY Authenticated users can delete service items ON public.service_items AS PERMISSIVE FOR DELETE TO authenticated USING (true);
CREATE POLICY Authenticated users can insert service items ON public.service_items AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY Authenticated users can update service items ON public.service_items AS PERMISSIVE FOR UPDATE TO authenticated USING (true);
CREATE POLICY Authenticated users can view service items ON public.service_items AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY Authenticated users can delete services ON public.services AS PERMISSIVE FOR DELETE TO authenticated USING (true);
CREATE POLICY Authenticated users can insert services ON public.services AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY Authenticated users can update services ON public.services AS PERMISSIVE FOR UPDATE TO authenticated USING (true);
CREATE POLICY Authenticated users can view services ON public.services AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY Allow all operations for authenticated users ON public.vehicle_filters AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'authenticated'::text));

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.__drizzle_migrations TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.__drizzle_migrations TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.__drizzle_migrations TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.appointments TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.appointments TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.appointments TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.batches TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.batches TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.batches TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.brands TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.brands TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.brands TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.categories TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.categories TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.categories TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.customer_vehicles TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.customer_vehicles TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.customer_vehicles TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.customers TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.customers TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.customers TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.inventory TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.inventory TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.inventory TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.labor_splits TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.labor_splits TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.labor_splits TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.locations TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.locations TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.locations TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.notifications TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.notifications TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.notifications TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.open_bottle_details TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.open_bottle_details TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.open_bottle_details TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.product_types TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.product_types TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.product_types TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.product_volumes TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.product_volumes TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.product_volumes TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.products TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.products TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.products TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.reference_number_counters TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.reference_number_counters TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.reference_number_counters TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.role_permissions TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.role_permissions TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.role_permissions TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.service_items TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.service_items TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.service_items TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.services TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.services TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.services TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.shops TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.shops TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.shops TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.staff TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.staff TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.staff TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.suppliers TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.suppliers TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.suppliers TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.trade_in_prices TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.trade_in_prices TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.trade_in_prices TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.trade_in_transactions TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.trade_in_transactions TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.trade_in_transactions TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.transactions TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.transactions TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.transactions TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.types TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.types TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.types TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.user_profiles TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.user_profiles TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.user_profiles TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.vehicle_filters TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.vehicle_filters TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.vehicle_filters TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.vehicles TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.vehicles TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.vehicles TO service_role;
