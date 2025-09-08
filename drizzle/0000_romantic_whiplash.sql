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
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
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
	"brand" text,
	"product_type" text,
	"description" text,
	"image_url" text,
	"low_stock_threshold" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" text NOT NULL,
	"location_id" uuid NOT NULL,
	"type" text NOT NULL,
	"total_amount" numeric NOT NULL,
	"items_sold" jsonb,
	"original_reference_number" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "transactions_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_volumes" ADD CONSTRAINT "product_volumes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;