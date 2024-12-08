import { updateDatabase } from '@db/index.js'
import { fetchAdyenData } from '@eapis/adyen.js'
import { TerminalData, StoreData } from 'types/adyen.js'
import { logger, parseStoreRef } from '../utils.js'

export const processTerminals = async ({
  requestId,
}: {
  requestId: string
}): Promise<[string, string, string][]> => {
  logger('adyen-sync-terminals').info({ requestId, message: 'Processing terminals' })
  const stores = (await fetchAdyenData({
    requestId,
    opts: {
      type: 'stores',
    },
  })) as StoreData[]
  logger('adyen-sync-terminals').debug({ requestId, message: 'Fetched stores', stores })
  const terminals = (await fetchAdyenData({
    requestId,
    opts: {
      type: 'terminals',
    },
  })) as TerminalData[]
  logger('adyen-sync-terminals').debug({ requestId, message: 'Fetched terminals', terminals })
  const mposDevices = terminals.filter(
    (terminal) =>
      terminal.model === 'S1E2L' && terminal.assignment.status.toLowerCase() != 'inventory',
  )
  logger('adyen-sync-terminals').debug({ requestId, message: 'Filtered terminals', mposDevices })
  const jmData: [string, string, string][] = []
  for (const mposDevice of mposDevices) {
    const store = stores.find((store) => store.id === mposDevice.assignment.storeId)
    if (!store?.reference) {
      logger('adyen-sync-terminals').error({
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
      logger('adyen-sync-terminals').error({
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
