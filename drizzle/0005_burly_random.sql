-- Migration: Add enterprise fields to staff table
-- Generated from schema changes in lib/db/schema.ts

ALTER TABLE "staff" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "role" text DEFAULT 'staff' NOT NULL;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "salary" numeric;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "hire_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "date_of_birth" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "national_id" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "emergency_contact" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "emergency_phone" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "shop_id" uuid;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_email_idx" ON "staff" USING btree ("email");--> statement-breakpoint
CREATE INDEX "staff_role_idx" ON "staff" USING btree ("role");--> statement-breakpoint
CREATE INDEX "staff_shop_idx" ON "staff" USING btree ("shop_id");
