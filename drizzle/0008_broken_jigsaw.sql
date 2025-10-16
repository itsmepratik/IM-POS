ALTER TABLE "staff" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "staff" CASCADE;--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_cashier_id_staff_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "cashier_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;