ALTER TABLE "terminals" ALTER COLUMN "merchant_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "terminals" ALTER COLUMN "adyen_store_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "terminals" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "terminals" ALTER COLUMN "model" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "terminals" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "terminals" ALTER COLUMN "serial_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "terminals" ADD COLUMN "ethernet_mac_address" varchar(255);--> statement-breakpoint
ALTER TABLE "terminals" ADD COLUMN "ethernet_ip_address" varchar(255);--> statement-breakpoint
ALTER TABLE "terminals" ADD COLUMN "ethernet_link_negotiation" varchar(255);--> statement-breakpoint
ALTER TABLE "terminals" ADD COLUMN "bluetooth_mac_address" varchar(255);--> statement-breakpoint
ALTER TABLE "terminals" ADD COLUMN "bluetooth_ip_address" varchar(255);--> statement-breakpoint
ALTER TABLE "terminals" ADD COLUMN "last_activity_at" varchar(255);--> statement-breakpoint
ALTER TABLE "terminals" ADD COLUMN "last_transaction_at" varchar(255);--> statement-breakpoint
ALTER TABLE "terminals" ADD COLUMN "restart_local_time" varchar(255);