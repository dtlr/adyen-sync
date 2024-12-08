ALTER TABLE "stores" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "terminals" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "terminals" ALTER COLUMN "store_id" SET DATA TYPE varchar(255);