import { logger } from '@util/logger.js'
import axios from 'axios'
import {
  type AdyenStoreCreate,
  type AdyenStore,
  type AdyenStoresResponse,
  type AdyenTerminal,
  type AdyenTerminalsResponse,
} from 'types/adyen.js'

import { type APP_ENVS } from '@/constants'
import { AppError } from '@/error.js'

const adyenConfig = (appEnv: (typeof APP_ENVS)[number]) => {
  const { ADYEN_KEY, ADYEN_KEY_LIVE, ADYEN_KEY_TEST } = process.env

  if (!ADYEN_KEY && (!ADYEN_KEY_LIVE || !ADYEN_KEY_TEST)) {
    throw new AppError({
      name: 'ADYEN_CONFIG_MISSING',
      message: 'ADYEN_KEY, ADYEN_KEY_LIVE, and ADYEN_KEY_TEST must be set',
    })
  }

  return {
    ax: axios.create({
      baseURL:
        appEnv === 'live' || appEnv === 'prod'
          ? 'https://management-live.adyen.com/v3'
          : 'https://management-test.adyen.com/v3',
      headers: {
        'Content-Type': 'application/json',
        'X-API-key':
          ADYEN_KEY ?? (appEnv === 'live' || appEnv === 'prod' ? ADYEN_KEY_LIVE : ADYEN_KEY_TEST),
      },
    }),
    key: ADYEN_KEY ?? (appEnv === 'live' || appEnv === 'prod' ? ADYEN_KEY_LIVE : ADYEN_KEY_TEST),
    endpoint:
      appEnv === 'live' || appEnv === 'prod'
        ? 'https://management-live.adyen.com/v3'
        : 'https://management-test.adyen.com/v3',
  }
}

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
  const { key, endpoint } = adyenConfig(appEnv)

  try {
    let pagesTotal: number
    let data: (AdyenStore | AdyenTerminal)[] = []
    const pageSize = opts.pageSize || 100
    let page = opts.page || 1

    const queryParams: Record<string, string> = {
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
        opts.type?.toLowerCase() === 'stores' ? `${endpoint}/stores` : `${endpoint}/terminals`
      const response = await axios.get<AdyenStoresResponse | AdyenTerminalsResponse>(query, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-key': key,
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
    throw new AppError({
      name: 'ADYEN_API',
      message: 'Error in the fetch call to Adyen API',
      cause: error,
    })
  }
}

export const updateAdyenStore = async (
  appEnv: (typeof APP_ENVS)[number],
  storeId: string,
  store: AdyenStoreCreate,
) => {
  const { ax } = adyenConfig(appEnv)
  const query = await ax.patch(`/stores/${storeId}`, store)
  return query.data
}

export const createAdyenStore = async (
  appEnv: (typeof APP_ENVS)[number],
  store: AdyenStoreCreate,
) => {
  const { ax } = adyenConfig(appEnv)
  const query = await ax.post<AdyenStore>(`/stores`, store)
  return query.data
}

export const deactivateAdyenStore = async (appEnv: (typeof APP_ENVS)[number], storeId: string) => {
  const { ax } = adyenConfig(appEnv)
  const query = await ax.patch(`/stores/${storeId}`, {
    status: 'inactive',
  })
  return query.data
}
