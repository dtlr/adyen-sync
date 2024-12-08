import axios from 'axios'
import type {
  AdyenStore,
  AdyenStoresResponse,
  AdyenTerminal,
  AdyenTerminalsResponse,
} from 'types/adyen.js'

import { AdyenSyncError } from '@/error.js'
import { logger } from '@/core/utils.js'
import { APP_ENVS } from '@/constants'

export const fetchAdyenData = async ({
  requestId,
  appEnv,
  opts = {},
}: {
  requestId: string
  appEnv: (typeof APP_ENVS)[number]
  opts: {
    type?: 'stores' | 'terminals'
    page?: number
    pageSize?: number
    brandModels?: string
    merchantIds?: string
    storeIds?: string
    reference?: string
  }
}) => {
  const adyenKey = process.env.ADYEN_KEY
    ? process.env.ADYEN_KEY
    : appEnv === 'live' || appEnv === 'prod'
      ? process.env.ADYEN_KEY_LIVE
      : process.env.ADYEN_KEY_TEST
  const adyenEndpoint =
    appEnv === 'live' || appEnv === 'prod' ? 'management-live' : 'management-test'
  try {
    let pagesTotal: number
    let data: (AdyenStore | AdyenTerminal)[] = []
    let pageSize = opts.pageSize || 100
    let page = opts.page || 1

    let queryParams: Record<string, string> = {
      pageSize: pageSize.toString(),
      page: page.toString(),
    }
    if (opts.type?.toLowerCase() === 'terminals' && opts.brandModels) {
      queryParams.brandModels = opts.brandModels
    }
    if (opts.type?.toLowerCase() === 'terminals' && opts.merchantIds) {
      queryParams.merchantIds = opts.merchantIds
    }
    if (opts.type?.toLowerCase() === 'terminals' && opts.storeIds) {
      queryParams.storeIds = opts.storeIds
    }
    if (opts.type?.toLowerCase() === 'stores' && opts.merchantIds) {
      queryParams.merchantId = opts.merchantIds
    }
    if (opts.type?.toLowerCase() === 'stores' && opts.reference) {
      queryParams.reference = opts.reference
    }

    logger('eapis-adyen').debug({
      message: `Fetching ${opts.type} data with query params: ${queryParams}`,
      requestId,
      extraInfo: { type: opts.type, queryParams },
    })

    do {
      const query =
        opts.type?.toLowerCase() === 'stores'
          ? `https://${adyenEndpoint}.adyen.com/v3/stores`
          : `https://${adyenEndpoint}.adyen.com/v3/terminals`
      const response = await axios.get<AdyenStoresResponse | AdyenTerminalsResponse>(query, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-key': adyenKey,
        },
        params: queryParams,
      })
      pagesTotal = response.data.pagesTotal
      const apiData = response.data.data
      data = data.concat(apiData)
      page++
    } while (pagesTotal > page)

    logger('eapis-adyen').debug({
      message: `Successfully fetched ${data.length} records`,
      requestId,
      data,
    })
    return opts.type === 'stores' ? (data as AdyenStore[]) : (data as AdyenTerminal[])
  } catch (error) {
    throw new AdyenSyncError({
      name: 'ADYEN_API',
      message: 'Error in the fetch call to Adyen API',
      cause: error,
    })
  }
}
