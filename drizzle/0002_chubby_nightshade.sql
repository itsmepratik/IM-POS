ALTER TABLE "products" DROP CONSTRAINT "products_type_id_types_id_fk";
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "shop_code" text DEFAULT '01';--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "zip_code" text DEFAULT '319';--> statement-breakpoint
ALTER TABLE "brands" DROP COLUMN "images";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "type_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "product_type";