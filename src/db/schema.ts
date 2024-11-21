import { pgTable, primaryKey, varchar, smallint, timestamp, integer, pgSequence } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const uptMgmtTargetVersionIdSeq = pgSequence("upt_mgmt_target_version_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })
export const uptMgmtInstallationIdSeq = pgSequence("upt_mgmt_installation_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })
export const symDataDataIdSeq = pgSequence("sym_data_data_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })

export const payAssignedPaymentDevice = pgTable("pay_assigned_payment_device", {
	deviceId: varchar("device_id", { length: 128 }).notNull(),
	businessUnitId: varchar("business_unit_id", { length: 128 }).notNull(),
	paymentDeviceId: varchar("payment_device_id", { length: 128 }),
	permanentFlag: smallint("permanent_flag").default(0),
	createTime: timestamp("create_time", { precision: 6, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createBy: varchar("create_by", { length: 50 }).default('system').notNull(),
	lastUpdateTime: timestamp("last_update_time", { precision: 6, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	lastUpdateBy: varchar("last_update_by", { length: 50 }).default('system').notNull(),
}, (table) => {
	return {
		payAssignedPaymentDevicePkey: primaryKey({ columns: [table.deviceId, table.businessUnitId], name: "pay_assigned_payment_device_pkey"}),
	}
});

export const payPaymentDevices = pgTable("pay_payment_devices", {
	id: varchar({ length: 128 }).notNull(),
	businessUnitId: varchar("business_unit_id", { length: 128 }).notNull(),
	configName: varchar("config_name", { length: 128 }),
	displayName: varchar("display_name", { length: 128 }),
	serverAddress: varchar("server_address", { length: 128 }),
	terminalId: varchar("terminal_id", { length: 128 }),
	displayOrder: integer("display_order"),
	sharedFlag: smallint("shared_flag").default(1),
	createTime: timestamp("create_time", { precision: 6, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createBy: varchar("create_by", { length: 50 }).default('system').notNull(),
	lastUpdateTime: timestamp("last_update_time", { precision: 6, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	lastUpdateBy: varchar("last_update_by", { length: 50 }).default('system').notNull(),
}, (table) => {
	return {
		payPaymentDevicesPkey: primaryKey({ columns: [table.id, table.businessUnitId], name: "pay_payment_devices_pkey"}),
	}
});

export const devDevicePersonalization = pgTable("dev_device_personalization", {
	deviceName: varchar("device_name", { length: 128 }).notNull(),
	serverUrl: varchar("server_url", { length: 128 }),
	serverAddress: varchar("server_address", { length: 128 }),
	serverPort: varchar("server_port", { length: 128 }),
	deviceId: varchar("device_id", { length: 128 }),
	appId: varchar("app_id", { length: 128 }),
	parentDeviceId: varchar("parent_device_id", { length: 128 }),
	parentAppId: varchar("parent_app_id", { length: 128 }),
	businessUnitId: varchar("business_unit_id", { length: 128 }),
	sslEnabledFlag: smallint("ssl_enabled_flag"),
	failoverAddress1: varchar("failover_address1", { length: 128 }),
	failoverPort1: varchar("failover_port1", { length: 128 }),
	failoverAddress2: varchar("failover_address2", { length: 128 }),
	failoverPort2: varchar("failover_port2", { length: 128 }),
	failoverAddress3: varchar("failover_address3", { length: 128 }),
	failoverPort3: varchar("failover_port3", { length: 128 }),
	failoverServerUrl1: varchar("failover_server_url1", { length: 128 }),
	failoverServerUrl2: varchar("failover_server_url2", { length: 128 }),
	failoverServerUrl3: varchar("failover_server_url3", { length: 128 }),
	createTime: timestamp("create_time", { precision: 6, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createBy: varchar("create_by", { length: 50 }).default('system').notNull(),
	lastUpdateTime: timestamp("last_update_time", { precision: 6, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	lastUpdateBy: varchar("last_update_by", { length: 50 }).default('system').notNull(),
	tagAppId: varchar("tag_app_id", { length: 32 }).default('*').notNull(),
	tagBusinessUnitId: varchar("tag_business_unit_id", { length: 32 }).default('*').notNull(),
	tagBrand: varchar("tag_brand", { length: 32 }).default('*').notNull(),
	tagDeviceId: varchar("tag_device_id", { length: 32 }).default('*').notNull(),
	tagCountry: varchar("tag_country", { length: 32 }).default('*').notNull(),
	tagState: varchar("tag_state", { length: 32 }).default('*').notNull(),
	tagStoreType: varchar("tag_store_type", { length: 32 }).default('*').notNull(),
	tagDeviceType: varchar("tag_device_type", { length: 32 }).default('*').notNull(),
}, (table) => {
	return {
		devDevicePersonalizationPkey: primaryKey({ columns: [table.deviceName, table.tagAppId, table.tagBusinessUnitId, table.tagBrand, table.tagDeviceId, table.tagCountry, table.tagState, table.tagStoreType, table.tagDeviceType], name: "dev_device_personalization_pkey"}),
	}
});
