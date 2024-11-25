import axios from 'axios'
import type { AdyenTerminalsResponse, StoreData, TerminalData } from './types.js'

import type { AdyenStoresResponse } from './types.js'
import { AdyenSyncError } from './error.js'
import { ADYEN_KEY } from './index.js'
import { ADYEN_KEY_LIVE, ADYEN_KEY_TEST, APP_ENV } from './index.js'
import { logger } from './utils.js'

export const fetchAdyenData = async ({
  requestId,
  opts = {},
}: {
  requestId: string
  opts: {
    type?: 'stores' | 'terminals'
    page?: number
    pageSize?: number
  }
}) => {
  const adyenKey = ADYEN_KEY
    ? ADYEN_KEY
    : APP_ENV?.toLowerCase() === 'prod'
      ? ADYEN_KEY_LIVE
      : ADYEN_KEY_TEST
  const adyenEndpoint = APP_ENV?.toLowerCase() === 'prod' ? 'management-live' : 'management-test'
  try {
    let pagesTotal: number
    let data: (StoreData | TerminalData)[] = []
    let page = opts.page || 1

    do {
      const query =
        opts.type?.toLowerCase() === 'stores'
          ? `https://${adyenEndpoint}.adyen.com/v3/stores?pageNumber=${page}&pageSize=${opts.pageSize}`
          : `https://${adyenEndpoint}.adyen.com/v3/terminals?pageNumber=${page}&pageSize=${opts.pageSize}`
      const response = await axios.get<AdyenStoresResponse | AdyenTerminalsResponse>(query, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-key': adyenKey,
        },
      })
      pagesTotal = response.data.pagesTotal
      const apiData = response.data.data
      data = data.concat(apiData)
      page++
    } while (pagesTotal > page)

    logger.info({
      message: `Successfully fetched ${data.length} records`,
      requestId,
      data,
    })
    return data
  } catch (error) {
    throw new AdyenSyncError({
      name: 'ADYEN_API',
      message: 'Error in the fetch call to Adyen API',
      cause: error,
    })
  }
}
