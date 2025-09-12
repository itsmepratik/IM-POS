CREATE TABLE "open_bottle_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_id" uuid NOT NULL,
	"initial_volume" numeric NOT NULL,
	"current_volume" numeric NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now(),
	"is_empty" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "open_bottle_details" ADD CONSTRAINT "open_bottle_details_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE cascade ON UPDATE no action;