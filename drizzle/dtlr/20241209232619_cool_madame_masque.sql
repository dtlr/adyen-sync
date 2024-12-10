CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_code" ON "stores" USING btree ("code");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_district" ON "stores" USING btree ("district");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_region" ON "stores" USING btree ("region");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_serial_number" ON "terminals" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_adyen_store_id" ON "terminals" USING btree ("adyen_store_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_store_id" ON "terminals" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_status" ON "terminals" USING btree ("status");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_model" ON "terminals" USING btree ("model");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_firmware_version" ON "terminals" USING btree ("firmware_version");