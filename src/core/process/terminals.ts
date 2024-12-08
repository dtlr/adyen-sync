import { fetchAdyenData } from '@eapis/adyen.js'
import { TerminalData } from 'types/adyen.js'
import { logger, parseStoreRef } from '../utils.js'
import { APP_ENVS, JDNAProperty } from '@/constants.js'

export const getJDNATerminals = async ({
  requestId,
  fascia,
  store_env,
}: {
  requestId: string
  fascia: (typeof JDNAProperty)[number] | 'all'
  store_env: (typeof APP_ENVS)[number]
}): Promise<TerminalData[]> => {
  logger('get-jdna-terminals').debug({
    requestId,
    message: `Syncing terminals for fascia: ${fascia}`,
  })
  const terminals = (await fetchAdyenData({
    requestId,
    opts: {
      type: 'terminals',
    },
  })) as TerminalData[]
  return terminals
}

export const processTerminals = async ({
  requestId,
  jdnaTerminals,
  fascia,
  store_env,
}: {
  requestId: string
  jdnaTerminals: TerminalData[]
  fascia: (typeof JDNAProperty)[number] | 'all'
  store_env: (typeof APP_ENVS)[number]
}): Promise<[string, string, string][]> => {
  logger('terminals').info({ requestId, message: 'Processing terminals' })
  // const stores = (await fetchAdyenData({
  //   requestId,
  //   opts: {
  //     type: 'stores',
  //   },
  // })) as StoreData[]
  logger('terminals').debug({ requestId, message: 'Fetched stores', stores })
  const mposDevices = terminals.filter(
    (terminal) =>
      terminal.model === 'S1E2L' && terminal.assignment.status.toLowerCase() != 'inventory',
  )
  logger('terminals').debug({ requestId, message: 'Filtered terminals', mposDevices })
  const jmData: [string, string, string][] = []
  for (const mposDevice of mposDevices) {
    const store = stores.find((store) => store.id === mposDevice.assignment.storeId)
    if (!store?.reference) {
      logger('terminals').error({
        requestId,
        name: 'ROUTE_FLEET',
        area: 'Store reference processing',
        message: 'Unable to find store reference',
        store,
        stores,
        mposDevice,
      })
      continue
    }
    const storeRef = parseStoreRef(store.reference)
    if (!storeRef?.prefix || !storeRef?.number) {
      logger('terminals').error({
        requestId,
        name: 'ROUTE_FLEET',
        area: 'Store reference processing',
        message: `Store ${store.id} reference, ${store.reference}, is not in the expected format.`,
      })
      continue
    }
    jmData.push([mposDevice.id, storeRef.prefix, storeRef.number])
  }
  // await updateDatabase({ requestId, data: jmData })
  return jmData
}
