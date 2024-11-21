-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SEQUENCE "public"."upt_mgmt_target_version_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."upt_mgmt_installation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."sym_data_data_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pay_assigned_payment_device" (
	"device_id" varchar(128) NOT NULL,
	"business_unit_id" varchar(128) NOT NULL,
	"payment_device_id" varchar(128),
	"permanent_flag" smallint DEFAULT 0,
	"create_time" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"create_by" varchar(50) DEFAULT 'system' NOT NULL,
	"last_update_time" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
	"last_update_by" varchar(50) DEFAULT 'system' NOT NULL,
	CONSTRAINT "pay_assigned_payment_device_pkey" PRIMARY KEY("device_id","business_unit_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pay_payment_devices" (
	"id" varchar(128) NOT NULL,
	"business_unit_id" varchar(128) NOT NULL,
	"config_name" varchar(128),
	"display_name" varchar(128),
	"server_address" varchar(128),
	"terminal_id" varchar(128),
	"display_order" integer,
	"shared_flag" smallint DEFAULT 1,
	"create_time" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"create_by" varchar(50) DEFAULT 'system' NOT NULL,
	"last_update_time" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
	"last_update_by" varchar(50) DEFAULT 'system' NOT NULL,
	CONSTRAINT "pay_payment_devices_pkey" PRIMARY KEY("id","business_unit_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dev_device_personalization" (
	"device_name" varchar(128) NOT NULL,
	"server_url" varchar(128),
	"server_address" varchar(128),
	"server_port" varchar(128),
	"device_id" varchar(128),
	"app_id" varchar(128),
	"parent_device_id" varchar(128),
	"parent_app_id" varchar(128),
	"business_unit_id" varchar(128),
	"ssl_enabled_flag" smallint,
	"failover_address1" varchar(128),
	"failover_port1" varchar(128),
	"failover_address2" varchar(128),
	"failover_port2" varchar(128),
	"failover_address3" varchar(128),
	"failover_port3" varchar(128),
	"failover_server_url1" varchar(128),
	"failover_server_url2" varchar(128),
	"failover_server_url3" varchar(128),
	"create_time" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"create_by" varchar(50) DEFAULT 'system' NOT NULL,
	"last_update_time" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
	"last_update_by" varchar(50) DEFAULT 'system' NOT NULL,
	"tag_app_id" varchar(32) DEFAULT '*' NOT NULL,
	"tag_business_unit_id" varchar(32) DEFAULT '*' NOT NULL,
	"tag_brand" varchar(32) DEFAULT '*' NOT NULL,
	"tag_device_id" varchar(32) DEFAULT '*' NOT NULL,
	"tag_country" varchar(32) DEFAULT '*' NOT NULL,
	"tag_state" varchar(32) DEFAULT '*' NOT NULL,
	"tag_store_type" varchar(32) DEFAULT '*' NOT NULL,
	"tag_device_type" varchar(32) DEFAULT '*' NOT NULL,
	CONSTRAINT "dev_device_personalization_pkey" PRIMARY KEY("device_name","tag_app_id","tag_business_unit_id","tag_brand","tag_device_id","tag_country","tag_state","tag_store_type","tag_device_type")
);

*/