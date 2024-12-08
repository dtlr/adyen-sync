import { init } from '@paralleldrive/cuid2'
import { pgTable, uuid, varchar, real, boolean } from 'drizzle-orm/pg-core'
import { commonTime } from './common'
import { createSelectSchema, createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import { relations } from 'drizzle-orm'

const createId = init({
  length: 44,
})

export const stores = pgTable('stores', {
  id: varchar('id', { length: 255 }).$defaultFn(createId).primaryKey(),
  code: varchar('code', { length: 255 }).notNull().unique(),
  aptosStoreCode: varchar('aptos_store_code', { length: 255 }).notNull(),
  banner: varchar('banner', { length: 24 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  shortName: varchar('short_name', { length: 255 }),
  status: boolean('status').notNull().default(false),
  district: varchar('district', { length: 255 }),
  region: varchar('region', { length: 255 }),
  addressCity: varchar('address_city', { length: 255 }),
  addressEmail: varchar('address_email', { length: 255 }),
  addressLine1: varchar('address_line1', { length: 255 }),
  addressLine2: varchar('address_line2', { length: 255 }),
  addressName: varchar('address_name', { length: 255 }),
  addressState: varchar('address_state', { length: 255 }),
  addressZipCode: varchar('address_zip_code', { length: 255 }),
  latitude: real('latitude'),
  longitude: real('longitude'),
  adyenMerchantId: varchar('adyen_merchant_id', { length: 255 }),
  adyenId: varchar('adyen_id', { length: 255 }),
  adyenReference: varchar('adyen_reference', { length: 255 }),
  adyenStatus: varchar('adyen_status', { length: 255 }),
  adyenDescription: varchar('adyen_description', { length: 255 }),
  ...commonTime,
})

export const SelectStoreSchema = createSelectSchema(stores)
export const InsertStoreSchema = createInsertSchema(stores)
export type SelectInternalStore = z.infer<typeof SelectStoreSchema>
export type InsertInternalStore = z.infer<typeof InsertStoreSchema>

export const terminals = pgTable('terminals', {
  id: varchar('id', { length: 255 }).$defaultFn(createId).primaryKey(),
  companyId: varchar('company_id', { length: 255 }).notNull(),
  merchantId: varchar('merchant_id', { length: 255 }).notNull(),
  adyenStoreId: varchar('adyen_store_id', { length: 255 }).notNull(),
  storeId: varchar('store_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  model: varchar('model', { length: 255 }),
  serialNumber: varchar('serial_number', { length: 255 }),
  firmwareVersion: varchar('firmware_version', { length: 255 }),
  cellularIccid: varchar('cellular_iccid', { length: 255 }),
  wifiIpAddress: varchar('wifi_ip_address', { length: 255 }),
  wifiMacAddress: varchar('wifi_mac_address', { length: 255 }),
  ...commonTime,
})

export const SelectTerminalSchema = createSelectSchema(terminals)
export const InsertTerminalSchema = createInsertSchema(terminals)
export type InternalTerminal = z.infer<typeof SelectTerminalSchema>

export const storeRelations = relations(stores, ({ many }) => ({
  terminals: many(terminals),
}))
