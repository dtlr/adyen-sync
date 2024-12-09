import * as neonSchema from '@db/neonSchema.js'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { type APP_ENVS, JDNAProperty } from '@/constants.js'
import { logger, parseStoreRef } from '@/core/utils.js'
import { type InsertInternalStore } from '@/db/neonSchema'
import { fetchAdyenData } from '@/eapis/adyen'
import { getLocations } from '@/eapis/jdna'
import { type AdyenStore } from '@/types/adyen'

export const getJDNAStores = async ({
  requestId,
  fascia,
  storeEnv,
}: {
  requestId: string
  fascia: keyof typeof JDNAProperty | 'all'
  storeEnv: (typeof APP_ENVS)[number]
}) => {
  logger('get-jdna-stores').debug({
    requestId,
    message: `Syncing stores for fascia: ${fascia}`,
  })
  let jdnaStoreData: Awaited<ReturnType<typeof getLocations>>

  if (fascia === 'all') {
    // get all stores
    const dtlrStores = await getLocations(requestId, storeEnv, 'dtlr')
    const shoePalaceStores = await getLocations(requestId, storeEnv, 'spc')
    jdnaStoreData = new Map([...dtlrStores, ...shoePalaceStores])
  } else {
    // get stores by fascia
    jdnaStoreData = await getLocations(requestId, storeEnv, fascia)
  }
  logger('get-jdna-stores').debug({
    requestId,
    message: `Got stores`,
    extraInfo: {
      fascia,
      storeEnv,
      stores: Array.from(jdnaStoreData.entries()),
    },
  })
  return jdnaStoreData
}

export const getAdyenStores = async ({
  requestId,
  fascia,
  storeEnv,
}: {
  requestId: string
  fascia: keyof typeof JDNAProperty | 'all'
  storeEnv: (typeof APP_ENVS)[number]
}) => {
  const stores = (await fetchAdyenData({
    requestId,
    appEnv: storeEnv,
    opts: {
      type: 'stores',
      merchantIds: fascia === 'all' ? undefined : JDNAProperty[fascia],
    },
  })) as AdyenStore[]
  return stores
}

export const processStores = async ({
  requestId,
  jdnaStores,
  adyenStores,
}: {
  requestId: string
  jdnaStores: Awaited<ReturnType<typeof getJDNAStores>>
  adyenStores: AdyenStore[]
}) => {
  logger('process-jdna-stores').info({
    requestId,
    message: `Processing ${jdnaStores.size} stores`,
  })
  const items: InsertInternalStore[] = []
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
  for (const banner of Object.keys(JDNAProperty)) {
    const tmp = items.filter((item) => item.banner === banner.toUpperCase())
    if (tmp.length === 0) {
      logger('process-jdna-stores').debug({
        requestId,
        message: `No stores found for ${banner}`,
      })
      continue
    }
    const connString = process.env[`${banner.toUpperCase()}_DATABASE_URI`]
    if (connString) {
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
    } else {
      logger('process-jdna-stores').error({
        requestId,
        message: `No database connection string found for ${banner}`,
      })
    }
  }

  return storeIds
}
