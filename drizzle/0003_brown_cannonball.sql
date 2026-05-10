CREATE INDEX "vehicles_plate_lower_idx" ON "customer_vehicles" USING btree (lower("license_plate"));--> statement-breakpoint
CREATE INDEX "customers_name_lower_idx" ON "customers" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "products_name_lower_idx" ON "products" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transactions_customer_idx" ON "transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "transactions_shop_idx" ON "transactions" USING btree ("shop_id");