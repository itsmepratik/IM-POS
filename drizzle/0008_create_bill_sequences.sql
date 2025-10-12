-- Create bill_sequences table for structured bill numbering
CREATE TABLE "bill_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_type" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"current_sequence" integer DEFAULT 0 NOT NULL,
	"location_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

-- Create unique constraint to ensure only one sequence per transaction type, month, year, and location
CREATE UNIQUE INDEX "bill_sequences_type_month_year_location_unique" ON "bill_sequences" ("transaction_type", "month", "year", "location_id");
--> statement-breakpoint

-- Add foreign key constraint for location_id
ALTER TABLE "bill_sequences" ADD CONSTRAINT "bill_sequences_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;
