import { updateDatabase } from '../../db'
import { fetchAdyenData } from '../../eapis/adyen'
import { TerminalData } from '../../types'
import { StoreData } from '../../types'
import { logger, parseStoreRef } from '../utils'

export const processTerminals = async ({
  requestId,
}: {
  requestId: string
}): Promise<[string, string, string][]> => {
  logger.info({ requestId, message: 'Processing terminals' })
  const stores = (await fetchAdyenData({
    requestId,
    opts: {
      type: 'stores',
    },
  })) as StoreData[]
  logger.debug({ requestId, message: 'Fetched stores', stores })
  const terminals = (await fetchAdyenData({
    requestId,
    opts: {
      type: 'terminals',
    },
  })) as TerminalData[]
  logger.debug({ requestId, message: 'Fetched terminals', terminals })
  const mposDevices = terminals.filter(
    (terminal) =>
      terminal.model === 'S1E2L' && terminal.assignment.status.toLowerCase() != 'inventory',
  )
  logger.debug({ requestId, message: 'Filtered terminals', mposDevices })
  const jmData: [string, string, string][] = []
  for (const mposDevice of mposDevices) {
    const store = stores.find((store) => store.id === mposDevice.assignment.storeId)
    if (!store?.reference) {
      logger.error({
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
      logger.error({
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
