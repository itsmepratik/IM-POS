CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_id" uuid NOT NULL,
	"cost_price" numeric NOT NULL,
	"quantity_received" integer NOT NULL,
	"stock_remaining" integer NOT NULL,
	"supplier" text,
	"purchase_date" timestamp with time zone DEFAULT now(),
	"is_active_batch" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"images" jsonb,
	CONSTRAINT "brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "customer_vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" text NOT NULL,
	"license_plate" text NOT NULL,
	"vin" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"standard_stock" integer DEFAULT 0,
	"selling_price" numeric,
	"open_bottles_stock" integer DEFAULT 0,
	"closed_bottles_stock" integer DEFAULT 0,
	"total_stock" integer GENERATED ALWAYS AS (COALESCE("standard_stock", 0) + COALESCE("open_bottles_stock", 0) + COALESCE("closed_bottles_stock", 0)) STORED
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "open_bottle_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_id" uuid NOT NULL,
	"initial_volume" numeric NOT NULL,
	"current_volume" numeric NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now(),
	"is_empty" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "product_volumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"volume_description" text NOT NULL,
	"selling_price" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid NOT NULL,
	"brand_id" uuid,
	"type_id" uuid,
	"product_type" text,
	"description" text,
	"image_url" text,
	"low_stock_threshold" integer DEFAULT 0,
	"cost_price" numeric,
	"manufacturing_date" timestamp with time zone,
	"is_battery" boolean DEFAULT false,
	"battery_state" text
);
--> statement-breakpoint
CREATE TABLE "reference_number_counters" (
	"prefix" text PRIMARY KEY NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location_id" uuid NOT NULL,
	"display_name" text,
	"pos_id" text,
	"brand_whatsapp" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "staff_staff_id_unique" UNIQUE("staff_id")
);
--> statement-breakpoint
CREATE TABLE "trade_in_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"size" text NOT NULL,
	"condition" text NOT NULL,
	"trade_in_value" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "trade_in_prices_size_condition_unique" UNIQUE("size","condition")
);
--> statement-breakpoint
CREATE TABLE "trade_in_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"trade_in_value" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" text NOT NULL,
	"location_id" uuid NOT NULL,
	"shop_id" uuid,
	"cashier_id" uuid,
	"type" text NOT NULL,
	"total_amount" numeric NOT NULL,
	"items_sold" jsonb,
	"payment_method" text,
	"car_plate_number" text,
	"mobile_payment_account" text,
	"mobile_number" text,
	"receipt_html" text,
	"battery_bill_html" text,
	"original_reference_number" text,
	"customer_id" uuid,
	"notes" text,
	"discount_type" text,
	"discount_value" numeric,
	"discount_amount" numeric,
	"subtotal_before_discount" numeric,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "transactions_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "types_category_id_name_unique" UNIQUE("category_id","name")
);
--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_bottle_details" ADD CONSTRAINT "open_bottle_details_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_volumes" ADD CONSTRAINT "product_volumes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_type_id_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_in_transactions" ADD CONSTRAINT "trade_in_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_in_transactions" ADD CONSTRAINT "trade_in_transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cashier_id_staff_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "types" ADD CONSTRAINT "types_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batches_inventory_active_idx" ON "batches" USING btree ("inventory_id","is_active_batch");--> statement-breakpoint
CREATE INDEX "inventory_product_location_idx" ON "inventory" USING btree ("product_id","location_id");--> statement-breakpoint
CREATE INDEX "open_bottle_details_inventory_empty_idx" ON "open_bottle_details" USING btree ("inventory_id","is_empty");--> statement-breakpoint
CREATE INDEX "product_volumes_product_idx" ON "product_volumes" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "transactions_ref_idx" ON "transactions" USING btree ("reference_number");