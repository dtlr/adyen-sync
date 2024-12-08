import { APP_ENVS, JDNAProperty } from '@/constants.js'
import { logger } from '@/core/utils.js'
import { getLocations } from '@/eapis/jdna'

export const processStores = async ({
  requestId,
  fascia,
  store_env,
}: {
  requestId: string
  fascia: (typeof JDNAProperty)[number] | 'all'
  store_env: (typeof APP_ENVS)[number]
}) => {
  logger('adyen-sync-process-stores').debug({
    requestId,
    message: `Syncing stores for fascia: ${fascia}`,
  })
  let jdnaStoreData: Awaited<ReturnType<typeof getLocations>>

  if (fascia === 'all') {
    // get all stores
    const dtlrStores = await getLocations(requestId, store_env, 'dtlr')
    const shoePalaceStores = await getLocations(requestId, store_env, 'spc')
    jdnaStoreData = new Map([...dtlrStores, ...shoePalaceStores])
  } else {
    // get stores by fascia
    jdnaStoreData = await getLocations(requestId, store_env, fascia)
  }
  logger('adyen-sync-process-stores').info({
    requestId,
    message: `Got ${jdnaStoreData.size} stores`,
    extraInfo: {
      fascia,
      store_env,
      data: Array.from(jdnaStoreData.entries()),
    },
  })
}
