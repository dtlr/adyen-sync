import { init } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgTable, varchar, real, boolean } from 'drizzle-orm/pg-core'
import { createSelectSchema, createInsertSchema } from 'drizzle-zod'
import { type z } from 'zod'
import { commonTime } from './common'

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

// index('idx_code')
//   .on(stores.code)
//   .concurrently()
//   .where(sql``)
//   .with({ fillfactor: 100 })
// index('idx_district')
//   .on(stores.district)
//   .concurrently()
//   .where(sql``)
//   .with({ fillfactor: 100 })
// index('idx_region')
//   .on(stores.region)
//   .concurrently()
//   .where(sql``)
//   .with({ fillfactor: 100 })

export const SelectStoreSchema = createSelectSchema(stores)
export const InsertStoreSchema = createInsertSchema(stores)
export type SelectInternalStore = z.infer<typeof SelectStoreSchema>
export type InsertInternalStore = z.infer<typeof InsertStoreSchema>

export const terminals = pgTable('terminals', {
  id: varchar('id', { length: 255 }).$defaultFn(createId).primaryKey(),
  companyId: varchar('company_id', { length: 255 }).notNull(),
  merchantId: varchar('merchant_id', { length: 255 }),
  adyenStoreId: varchar('adyen_store_id', { length: 255 }),
  storeId: varchar('store_id', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  model: varchar('model', { length: 255 }).notNull(),
  status: varchar('status', { length: 255 }).notNull(),
  serialNumber: varchar('serial_number', { length: 255 }).notNull().unique(),
  firmwareVersion: varchar('firmware_version', { length: 255 }),
  cellularIccid: varchar('cellular_iccid', { length: 255 }),
  cellularStatus: varchar('cellular_status', { length: 255 }),
  wifiIpAddress: varchar('wifi_ip_address', { length: 255 }),
  wifiMacAddress: varchar('wifi_mac_address', { length: 255 }),
  ethernetMacAddress: varchar('ethernet_mac_address', { length: 255 }),
  ethernetIpAddress: varchar('ethernet_ip_address', { length: 255 }),
  ethernetLinkNegotiation: varchar('ethernet_link_negotiation', { length: 255 }),
  bluetoothMacAddress: varchar('bluetooth_mac_address', { length: 255 }),
  bluetoothIpAddress: varchar('bluetooth_ip_address', { length: 255 }),
  lastActivityAt: varchar('last_activity_at', { length: 255 }),
  lastTransactionAt: varchar('last_transaction_at', { length: 255 }),
  restartLocalTime: varchar('restart_local_time', { length: 255 }),
  ...commonTime,
})

// index('idx_serial_number')
//   .on(terminals.serialNumber)
//   .concurrently()
//   .where(sql``)
//   .with({ fillfactor: 100 })
// index('idx_adyen_store_id')
//   .on(terminals.adyenStoreId)
//   .concurrently()
//   .where(sql``)
//   .with({ fillfactor: 100 })
// index('idx_store_id')
//   .on(terminals.storeId)
//   .concurrently()
//   .where(sql``)
//   .with({ fillfactor: 100 })
// index('idx_status')
//   .on(terminals.status)
//   .concurrently()
//   .where(sql``)
//   .with({ fillfactor: 100 })
// index('idx_model')
//   .on(terminals.model)
//   .concurrently()
//   .where(sql``)
//   .with({ fillfactor: 100 })
// index('idx_firmware_version')
//   .on(terminals.firmwareVersion)
//   .concurrently()
//   .where(sql``)
//   .with({ fillfactor: 100 })

export const SelectTerminalSchema = createSelectSchema(terminals)
export const InsertTerminalSchema = createInsertSchema(terminals)
export type SelectInternalTerminal = z.infer<typeof SelectTerminalSchema>
export type InsertInternalTerminal = z.infer<typeof InsertTerminalSchema>

export const storeRelations = relations(stores, ({ many }) => ({
  terminals: many(terminals),
}))
