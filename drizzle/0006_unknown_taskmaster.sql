CREATE TABLE "cash_shift_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount" numeric NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cash_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"opened_by_staff_id" uuid NOT NULL,
	"closed_by_staff_id" uuid,
	"status" text DEFAULT 'open' NOT NULL,
	"start_time" timestamp with time zone DEFAULT now() NOT NULL,
	"end_time" timestamp with time zone,
	"opening_cash" numeric DEFAULT '0' NOT NULL,
	"opening_denominations" jsonb,
	"opening_notes" text,
	"expected_closing_cash" numeric,
	"actual_closing_cash" numeric,
	"closing_denominations" jsonb,
	"cash_difference" numeric,
	"closing_notes" text,
	"total_cash_sales" numeric DEFAULT '0',
	"total_card_sales" numeric DEFAULT '0',
	"total_mobile_sales" numeric DEFAULT '0',
	"total_credit_sales" numeric DEFAULT '0',
	"total_refunds" numeric DEFAULT '0',
	"total_transactions" integer DEFAULT 0,
	"reconciled_by_staff_id" uuid,
	"reconciled_at" timestamp with time zone,
	"reconciliation_notes" text,
	"reconciliation_status" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "cash_shift_id" uuid;--> statement-breakpoint
ALTER TABLE "cash_shift_movements" ADD CONSTRAINT "cash_shift_movements_shift_id_cash_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."cash_shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_shift_movements" ADD CONSTRAINT "cash_shift_movements_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_opened_by_staff_id_staff_id_fk" FOREIGN KEY ("opened_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_closed_by_staff_id_staff_id_fk" FOREIGN KEY ("closed_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_reconciled_by_staff_id_staff_id_fk" FOREIGN KEY ("reconciled_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cash_shift_movements_shift_idx" ON "cash_shift_movements" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "cash_shift_movements_staff_idx" ON "cash_shift_movements" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "cash_shifts_shop_status_idx" ON "cash_shifts" USING btree ("shop_id","status");--> statement-breakpoint
CREATE INDEX "cash_shifts_start_time_idx" ON "cash_shifts" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "cash_shifts_opened_by_idx" ON "cash_shifts" USING btree ("opened_by_staff_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cash_shift_id_cash_shifts_id_fk" FOREIGN KEY ("cash_shift_id") REFERENCES "public"."cash_shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_cash_shift_idx" ON "transactions" USING btree ("cash_shift_id");