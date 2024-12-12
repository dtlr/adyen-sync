import { z } from 'zod'

export type PromiseResolvedType<T> = T extends Promise<infer R> ? R : never

export type NestedOmit<Schema, Path extends string> = Path extends `${infer Head}.${infer Tail}`
  ? Head extends keyof Schema
    ? {
        [K in keyof Schema]: K extends Head ? NestedOmit<Schema[K], Tail> : Schema[K]
      }
    : Schema
  : Omit<Schema, Path>

export type Bindings = {
  APP_ENV: 'PROD' | 'prod' | 'QA' | 'qa' | 'DEV' | 'dev' | undefined
  DATABASE_URL?: string
  DB_HOST: string
  DB_PORT: string
  DB_USER: string
  DB_PASSWORD: string
  ADYEN_KEY_TEST: string
  ADYEN_KEY_LIVE: string
}

// const Chain = z.enum(['DTLR', ' ', 'Shoepalace', 'Shoe Palace']);
// const Region = z.enum(['Northeast', 'E-Commerce', 'South', 'Midwest', 'Corporate Office', 'Distribution Center']);
// const LocationStatusLabel = z.enum(['Closed', 'Comparative', 'Non-Comparative', 'Open', 'None']);
// const LocationTypeLabel = z.enum(['Store', 'Warehouse', 'Distribution Center', 'Head Office']);
const CustPropCode = z.enum(['COVID'])
const CustPropLabel = z.enum(['Reopen from Covid closure'])
const dailyHourSchema = z.object({
  dayOfWeek: z.number(),
  openTime: z.string(),
  closeTime: z.string(),
})

const attributeSchema = z.object({
  entity_attribute_set_id: z.number(),
  parent_type: z.number(),
  parent_id: z.number(),
  attribute_set_id: z.number(),
  attribute_id: z.number(),
  attribute_entity_last_modified_date: z.coerce.date().nullable(),
  attribute_code: z.string(),
  attribute_label: z.string(),
  mandatory_flag: z.boolean(),
  exclusive_flag: z.boolean(),
  attribute_active_flag: z.boolean(),
  updatestamp: z.number(),
  last_item_id: z.number(),
  send_to_planning_flag: z.boolean(),
  attribute_set_code: z.string(),
  attribute_set_label: z.string(),
  default_flag: z.boolean(),
  attribute_set_active_flag: z.boolean(),
  sequence_number: z.number().nullable(),
})

const propertySchema = z.object({
  entity_custom_property_id: z.number(),
  custom_property_id: z.number(),
  parent_type: z.number(),
  parent_id: z.number(),
  custom_property_value: z.string(),
  cust_prop_code: CustPropCode,
  cust_prop_label: CustPropLabel,
  property_type: z.number(),
  entity_type: z.number(),
  active_flag: z.boolean(),
  updatestamp: z.number(),
  exclusive_flag: z.boolean(),
})
export const addressSchema = z.object({
  address_id: z.number(),
  parent_id: z.number(),
  parent_type: z.number(),
  address_type_id: z.number(),
  address_name: z.string(),
  address_line1: z.string(),
  address_line2: z.string().nullable(),
  address_city: z.string().nullable(),
  address_state: z.string().nullable(),
  address_zip_code: z.string().nullable(),
  country_id: z.number(),
  address_email: z.string().nullable(),
  document_id: z.string().nullable(),
})

const contactSchema = z.object({
  contact_id: z.number(),
  parent_id: z.number(),
  parent_type: z.number(),
  contact_type: z.number(),
  contact_description1: z.string(),
  contact_description2: z.string().nullable(),
  contact_number: z.string(),
  contact_extension: z.string().nullable(),
  main_flag: z.boolean(),
})

export const locationSchema = z.object({
  location_id: z.number(),
  location_type: z.number(),
  location_code: z.string(),
  location_name: z.string(),
  location_short_name: z.string().nullable(),
  register_type_id: z.number().nullable(),
  generate_plu_file_flag: z.boolean(),
  location_status_id: z.number(),
  active_flag: z.boolean(),
  gl_company_id: z.number(),
  gl_location_number: z.string(),
  jurisdiction_id: z.number(),
  selling_space: z.number().nullable(),
  non_selling_space: z.number().nullable(),
  target_sales: z.number().nullable(),
  occupancy_cost: z.coerce.string().nullable(),
  language_id: z.number(),
  shrinkage_factor: z.number(),
  warehouse_system_flag: z.boolean(),
  replenish_flag: z.boolean(),
  allow_customer_shipment_flag: z.boolean(),
  allow_customer_pickup_flag: z.boolean(),
  allow_customer_transfer_flag: z.boolean(),
  open_date: z.coerce.date().nullable(),
  comparative_date: z.coerce.date().nullable(),
  closed_date: z.coerce.date().nullable(),
  closed_reason: z.string().nullable(),
  reopen_date: z.coerce.date().nullable(),
  remodel_start_date: z.coerce.date().nullable(),
  remodel_end_date: z.coerce.date().nullable(),
  open_to_receive_date: z.coerce.date().nullable(),
  updatestamp: z.number(),
  tkt_override_tkt_price_flag: z.boolean(),
  tkt_safety_stock_amt: z.number(),
  tkt_safety_stock_percent: z.number(),
  tkt_safety_stock_max_safe_unit: z.number(),
  tkt_days_to_keep_printed_tkts: z.number(),
  tkt_days_to_keep_non_print_tkt: z.number(),
  tkt_override_tkt_upc_val_flag: z.boolean(),
  tkt_upc_type_order: z.number(),
  polling_reference: z.number().nullable(),
  reserve_wh_for_alloc_loc_id: z.coerce.string().nullable(),
  last_item_id: z.number(),
  tax_registration_number1: z.coerce.string().nullable(),
  tax_registration_number2: z.coerce.string().nullable(),
  uses_oim_flag: z.boolean(),
  pos_server_flag: z.coerce.string().nullable(),
  pos_server_id: z.coerce.string().nullable(),
  auto_receive_shipments_flag: z.boolean(),
  allow_customer_order_flag: z.boolean(),
  routing_priority: z.number(),
  send_inv_move_to_es_flag: z.boolean(),
  last_modified_date: z.coerce.date(),
  generate_thin_plu_file_flag: z.boolean(),
  es_allow_customer_pickup_order_flag: z.boolean(),
  receive_eom_po_flag: z.boolean(),
  selling_location: z.boolean(),
  default_distribution_position_id: z.coerce.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  channel_id: z.coerce.string().nullable(),
  location_format_id: z.coerce.string().nullable(),
  ticket_printer_type: z.number(),
  auto_receive_transfers_flag: z.boolean(),
  location_type_label: z.string(),
  location_status_label: z.string(),
  chain: z.string(),
  channel: z.string(),
  region: z.string(),
  district: z.string(),
  addresses: z.array(addressSchema),
  attributes: attributeSchema.array(),
  properties: propertySchema.array(),
  contact: contactSchema.nullable(),
  dailyHours: dailyHourSchema.array().nullable(),
})

export const locationsSchema = locationSchema.array()
export type Location = z.infer<typeof locationSchema>
export const localLocationSchema = locationSchema.pick({
  location_code: true,
  location_name: true,
  location_short_name: true,
  longitude: true,
  latitude: true,
  active_flag: true,
  chain: true,
  channel: true,
  district: true,
  region: true,
  contact: true,
  addresses: true,
})
export type LocationLocal = z.infer<typeof localLocationSchema>
