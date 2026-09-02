CREATE TABLE IF NOT EXISTS "product_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"type_id" uuid NOT NULL,
	CONSTRAINT "product_types_product_type_key" UNIQUE("product_id","type_id")
);--> statement-breakpoint
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_type_id_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_types_product_idx" ON "product_types" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_types_type_idx" ON "product_types" USING btree ("type_id");