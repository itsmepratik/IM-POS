ALTER TABLE "shops" ADD COLUMN "supervisor_password_hash" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "is_voided" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "voided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "voided_by_staff_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "void_reason" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_voided_by_staff_id_staff_id_fk" FOREIGN KEY ("voided_by_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;