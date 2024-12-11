import * as neonSchema from '@db/neonSchema.js'
import { fetchAdyenData } from '@eapis/adyen.js'
import { getLocations } from '@eapis/jdna.js'
import { parseStoreRef } from '@util'
import { logger } from '@util/logger.js'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { type AdyenStore } from 'types/adyen.js'
import { type APP_ENVS } from '@/constants.js'
import { AppError } from '@/error.js'

export const getJDNAStores = async ({
  requestId,
  banner,
  storeEnv,
}: {
  requestId: string
  banner: string
  storeEnv: (typeof APP_ENVS)[number]
}) => {
  logger('get-jdna-stores').debug({
    requestId,
    message: `Syncing stores for banner: ${banner}`,
  })
  const jdnaStoreData = await getLocations(requestId, storeEnv, banner)

  logger('get-jdna-stores').debug({
    requestId,
    message: `Got stores`,
    extraInfo: {
      banner,
      storeEnv,
      stores: Array.from(jdnaStoreData.entries()),
    },
  })
  return jdnaStoreData
}

export const getAdyenStores = async ({
  requestId,
  merchantId,
  storeEnv,
}: {
  requestId: string
  merchantId: string
  storeEnv: (typeof APP_ENVS)[number]
}) => {
  const stores = (await fetchAdyenData({
    requestId,
    appEnv: storeEnv,
    opts: {
      type: 'stores',
      merchantIds: merchantId,
    },
  })) as AdyenStore[]
  return stores
}

export const processJDNAStores = async ({
  requestId,
  banner,
  jdnaStores,
  adyenStores,
}: {
  requestId: string
  banner: string
  jdnaStores: Awaited<ReturnType<typeof getJDNAStores>>
  adyenStores: AdyenStore[]
}) => {
  logger('process-jdna-stores').info({
    requestId,
    message: `Processing ${jdnaStores.size} stores`,
  })
  const items: neonSchema.InsertInternalStore[] = []
  const storeIds: string[] = []

  for (const [storeId, store] of jdnaStores.entries()) {
    items.push({
      code: storeId,
      aptosStoreCode: parseStoreRef(storeId)?.number ?? '',
      addressCity: store.addresses[0].address_city,
      addressEmail: store.addresses[0].address_email,
      addressLine1: store.addresses[0].address_line1,
      addressLine2: store.addresses[0].address_line2,
      addressName: store.addresses[0].address_name,
      addressState: store.addresses[0].address_state,
      addressZipCode: store.addresses[0].address_zip_code,
      banner: parseStoreRef(storeId)?.prefix ?? '',
      district: store.district,
      latitude: store.latitude,
      longitude: store.longitude,
      name: store.location_name,
      shortName: store.location_short_name,
      region: store.region,
      status: store.active_flag,
      adyenMerchantId: adyenStores.find((adyenStore) => adyenStore.reference === storeId)
        ?.merchantId,
      adyenId: adyenStores.find((adyenStore) => adyenStore.reference === storeId)?.id,
      adyenReference: adyenStores.find((adyenStore) => adyenStore.reference === storeId)?.reference,
      adyenStatus: adyenStores.find((adyenStore) => adyenStore.reference === storeId)?.status,
      adyenDescription: adyenStores.find((adyenStore) => adyenStore.reference === storeId)
        ?.description,
    })
  }

  // Add other common store processing here

  // Commit to the database
  const tmp = items.filter((item) => item.banner === banner.toUpperCase())
  if (tmp.length === 0) {
    logger('process-jdna-stores').debug({
      requestId,
      message: `No stores found for ${banner}`,
    })
    return []
  }
  const connString = process.env[`${banner.toUpperCase()}_DATABASE_URI`]
  if (!connString) {
    throw new AppError({
      requestId,
      name: 'DATABASE_CONFIG_MISSING',
      message: `No database connection string found for ${banner}`,
    })
  }
  logger('process-jdna-stores').debug({
    requestId,
    message: `Using database connection string: ${process.env[`${banner.toUpperCase()}_DATABASE_URI`]}`,
  })
  try {
    const db = drizzle(connString, { schema: neonSchema })
    await db.transaction(async (tx) => {
      for (const item of tmp) {
        await tx
          .insert(neonSchema.stores)
          .values(item)
          .onConflictDoUpdate({
            target: [neonSchema.stores.code],
            set: item,
          })
      }
    })
    storeIds.push(...tmp.map((item) => item.code))
  } catch (error) {
    logger('process-jdna-stores').error({
      requestId,
      message: `Error processing stores for ${banner}`,
      error,
    })
    throw new AppError({
      requestId,
      name: 'UPDATE_DATABASE',
      message: `Error processing stores for ${banner}`,
      cause: error,
    })
  }

  return storeIds
}
