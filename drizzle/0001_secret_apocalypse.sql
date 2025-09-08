CREATE TABLE "trade_in_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"trade_in_value" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "shop_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "cashier_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "receipt_html" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "battery_bill_html" text;--> statement-breakpoint
ALTER TABLE "trade_in_transactions" ADD CONSTRAINT "trade_in_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_in_transactions" ADD CONSTRAINT "trade_in_transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_shop_id_locations_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;