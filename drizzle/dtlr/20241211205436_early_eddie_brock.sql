CREATE TABLE IF NOT EXISTS "stores" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"code" varchar(255) NOT NULL,
	"aptos_store_code" varchar(255) NOT NULL,
	"banner" varchar(24) NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_name" varchar(255),
	"status" boolean DEFAULT false NOT NULL,
	"district" varchar(255),
	"region" varchar(255),
	"address_city" varchar(255),
	"address_email" varchar(255),
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"address_name" varchar(255),
	"address_state" varchar(255),
	"address_zip_code" varchar(255),
	"latitude" real,
	"longitude" real,
	"adyen_merchant_id" varchar(255),
	"adyen_id" varchar(255),
	"adyen_reference" varchar(255),
	"adyen_status" varchar(255),
	"adyen_description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "stores_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "terminals" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"merchant_id" varchar(255),
	"adyen_store_id" varchar(255),
	"store_id" varchar(255),
	"name" varchar(255) NOT NULL,
	"model" varchar(255) NOT NULL,
	"status" varchar(255) NOT NULL,
	"serial_number" varchar(255) NOT NULL,
	"firmware_version" varchar(255),
	"cellular_iccid" varchar(255),
	"cellular_status" varchar(255),
	"wifi_ip_address" varchar(255),
	"wifi_mac_address" varchar(255),
	"ethernet_mac_address" varchar(255),
	"ethernet_ip_address" varchar(255),
	"ethernet_link_negotiation" varchar(255),
	"bluetooth_mac_address" varchar(255),
	"bluetooth_ip_address" varchar(255),
	"last_activity_at" varchar(255),
	"last_transaction_at" varchar(255),
	"restart_local_time" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "terminals_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_code" ON "stores" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_district" ON "stores" USING btree ("district");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_region" ON "stores" USING btree ("region");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_serial_number" ON "terminals" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_adyen_store_id" ON "terminals" USING btree ("adyen_store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_store_id" ON "terminals" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_status" ON "terminals" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_model" ON "terminals" USING btree ("model");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_firmware_version" ON "terminals" USING btree ("firmware_version");