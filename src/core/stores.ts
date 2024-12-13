import { neonDb } from '@core/db'
import * as neonSchema from '@db/neonSchema.js'
import { createAdyenStore, deactivateAdyenStore, updateAdyenStore } from '@eapis/adyen.js'
import { type getJDNAStores } from '@eapis/jdna.js'
import { parseStoreRef } from '@util'
import { logger } from '@util/logger.js'
import { AxiosError } from 'axios'
import { eq } from 'drizzle-orm'
import { type AdyenStoreCreate, type AdyenStore, type AdyenStoreUpdate } from 'types/adyen.js'
import { type APP_ENVS } from '@/constants.js'
import { AppError } from '@/error.js'
import 'dotenv/config'

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
  const newStores: neonSchema.InsertInternalStore[] = []
  const updatedStores: neonSchema.InsertInternalStore[] = []
  const storeIds: string[] = []

  logger('process-jdna-stores').debug({
    requestId,
    message: `Processing stores for ${banner}`,
    extraInfo: {
      jdnaStoresCount: jdnaStores.size,
      adyenStoresCount: adyenStores.length,
      adyenReferences: adyenStores.map((adyenStore) => ({
        reference: adyenStore.reference,
        merchantId: adyenStore.merchantId,
        id: adyenStore.id,
        status: adyenStore.status,
        description: adyenStore.description,
      })),
    },
  })

  const { APP_NEON_DATABASE_URI } = process.env
  if (!APP_NEON_DATABASE_URI) {
    throw new AppError({
      requestId,
      name: 'DATABASE_CONFIG_MISSING',
      message: `No database connection string found for ${banner}`,
    })
  }

  const db = neonDb(APP_NEON_DATABASE_URI, { schema: neonSchema })
  const jdnaStoreData = await db.select().from(neonSchema.stores)

  for (const [storeId, store] of jdnaStores.entries()) {
    const storeRef = parseStoreRef(storeId)

    if (!storeRef || !storeRef.prefix || !storeRef.number) {
      logger('process-jdna-stores').debug({
        requestId,
        message: `Skipping store ${storeId} because it is not a valid store reference`,
        extraInfo: {
          storeId,
          storeRef,
        },
      })
      continue
    }

    const existingStore = jdnaStoreData.find((s) => s.code === storeId)
    const item = {
      code: storeId,
      aptosStoreCode: storeRef.number,
      addressCity: store.addresses[0].address_city,
      addressEmail: store.addresses[0].address_email,
      addressLine1: store.addresses[0].address_line1,
      addressLine2: store.addresses[0].address_line2,
      addressName: store.addresses[0].address_name,
      addressState: store.addresses[0].address_state,
      addressZipCode: store.addresses[0].address_zip_code,
      banner: storeRef.prefix,
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
      updatedAt: new Date(),
      deletedAt: store.active_flag ? null : new Date(),
    }

    if (existingStore) {
      // If store exists, compare to see if it has changed
      const hasChanges = Object.entries(item).some(([key, value]) => {
        // Skip updatedAt since it's always different
        if (['updatedAt', 'createdAt', 'deletedAt'].includes(key)) return false
        return (
          JSON.stringify(value) !== JSON.stringify(existingStore[key as keyof typeof existingStore])
        )
      })

      if (hasChanges) {
        updatedStores.push(item)
      } else {
        logger('process-jdna-stores').debug({
          requestId,
          message: `No changes detected for store ${storeId}`,
          extraInfo: { storeId },
        })
      }
      continue
    } else {
      newStores.push(item)
    }
  }

  // Add other common store processing here

  // Commit to the database
  const filteredNewStores = newStores.filter((item) => item.banner === banner.toUpperCase())
  const filteredUpdatedStores = updatedStores.filter((item) => item.banner === banner.toUpperCase())
  logger('process-jdna-stores').debug({
    requestId,
    message: `Processing ${filteredNewStores.length} new stores and ${filteredUpdatedStores.length} updated stores for ${banner}`,
  })
  if (filteredNewStores.length === 0 && filteredUpdatedStores.length === 0) {
    logger('process-jdna-stores').debug({
      requestId,
      message: `No new or updated stores found for ${banner}`,
    })
    return []
  }
  try {
    await db.transaction(async (tx) => {
      for (const item of filteredNewStores) {
        await tx.insert(neonSchema.stores).values(item)
      }
      for (const item of filteredUpdatedStores) {
        await tx.update(neonSchema.stores).set(item).where(eq(neonSchema.stores.code, item.code))
      }
    })
    storeIds.push(...filteredNewStores.map((item) => item.code))
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

export const processAdyenStores = async ({
  requestId,
  banner,
  merchantId,
  appEnv,
}: {
  requestId: string
  banner: string
  merchantId: string
  appEnv: (typeof APP_ENVS)[number]
}) => {
  // Read all stores from the database using banner to determine which database to use
  const { APP_NEON_DATABASE_URI } = process.env
  if (!APP_NEON_DATABASE_URI) {
    throw new AppError({
      requestId,
      name: 'DATABASE_CONFIG_MISSING',
      message: `No database connection string found for ${banner}`,
    })
  }
  let currentItem: neonSchema.SelectInternalStore | undefined
  let currentItemParsed: AdyenStoreCreate | AdyenStoreUpdate | undefined
  try {
    const db = neonDb(APP_NEON_DATABASE_URI, { schema: neonSchema })
    const stores = await db.select().from(neonSchema.stores)
    // Iterate over the stores and test for the following:
    // 1. If the store has an adyenId, then we need to update the record in Adyen
    // 2. If the store does not have an adyenId, then we need to create a new store in Adyen
    // Be sure to update the database with the new adyenId and adyenReference
    for (const store of stores) {
      const adyenStore: AdyenStoreCreate = {
        description: store.name,
        shopperStatement: store.code,
        phoneNumber: '+14108505911',
        merchantId,
        reference: store.code,
        address: {
          country: 'US',
          line1: store.addressLine1!,
          line2: store.addressLine2 || undefined,
          city: store.addressCity!,
          postalCode: store.addressZipCode!,
          stateOrProvince: store.addressState!.trim().toUpperCase(),
        },
      }
      currentItem = store
      currentItemParsed = adyenStore

      // Check if store was updated in the last 8 hours
      const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000)
      if (store.adyenId && store.status && store.updatedAt && store.updatedAt > eightHoursAgo) {
        logger('process-adyen-stores').info({
          requestId,
          message: 'Updating store',
          extraInfo: {
            storeId: store.adyenId,
          },
        })
        const { address, reference, merchantId, shopperStatement, ...rest } = adyenStore
        const { country, ...restAddress } = address
        const updatedStore = { ...rest, address: restAddress }
        currentItemParsed = updatedStore
        await updateAdyenStore(appEnv, store.adyenId, updatedStore)
      } else if (!store.adyenId && store.status) {
        logger('process-adyen-stores').info({
          requestId,
          message: 'Creating store',
          extraInfo: {
            storeId: store.adyenId,
          },
        })
        const newStore = await createAdyenStore(appEnv, adyenStore)
        await db
          .update(neonSchema.stores)
          .set({
            adyenId: newStore.id,
            adyenReference: newStore.reference,
          })
          .where(eq(neonSchema.stores.code, store.code))
      } else if (store.adyenId && !store.status) {
        logger('process-adyen-stores').info({
          requestId,
          message: 'Deactivating store',
          extraInfo: {
            storeId: store.adyenId,
          },
        })
        await deactivateAdyenStore(appEnv, store.adyenId)
        await db
          .update(neonSchema.stores)
          .set({
            adyenId: null,
            adyenReference: null,
          })
          .where(eq(neonSchema.stores.code, store.code))
      }
    }
  } catch (error) {
    logger('process-adyen-stores').error({
      requestId,
      message: `Error processing stores for ${banner}`,
      error: error instanceof AxiosError ? error.response?.data : (error as Error).message,
      cause: error instanceof Error ? error.stack : undefined,
      extraInfo: {
        currentItem,
        currentItemParsed,
      },
    })
    throw new AppError({
      requestId,
      name: 'PROCESS_ADYEN_STORES',
      message: `Error processing stores for ${banner}`,
      cause: {
        currentItem,
        currentItemParsed,
        stack: error instanceof AxiosError ? error.response?.data : (error as Error).stack,
      },
    })
  }
}
