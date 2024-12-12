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

export const getAdyenStores = async ({
  requestId,
  appEnv,
  opts = {},
}: {
  requestId: string
  appEnv: (typeof APP_ENVS)[number]
  opts: {
    pageSize?: number
    merchantIds?: string
    storeIds?: string
    reference?: string
  }
}) => {
  const { ax } = adyenConfig(appEnv)

  try {
    let pagesTotal: number
    let data: AdyenStore[] = []
    const pageSize = opts.pageSize || 100
    let pageNumber = 1

    let totalDataFetched = 0
    const queryParams: Record<string, string> = {}
    if (opts.storeIds) {
      queryParams.storeIds = opts.storeIds
    }
    if (opts.merchantIds) {
      queryParams.merchantId = opts.merchantIds
    }
    if (opts.reference) {
      queryParams.reference = opts.reference
    }

    do {
      logger('eapis-adyen').debug({
        message: `Fetching stores data with query params`,
        requestId,
        extraInfo: { queryParams },
      })
      const response = await ax.get<AdyenStoresResponse>('/stores', {
        params: {
          ...queryParams,
          pageSize: pageSize,
          pageNumber,
        },
      })
      pagesTotal = response.data.pagesTotal
      logger('eapis-adyen').debug({
        message: `Fetched ${response.data.data.length} records`,
        requestId,
        extraInfo: {
          storeReferences: response.data.data.map((store) => store.reference),
        },
      })
      data = [...data, ...response.data.data]
      totalDataFetched += response.data.data.length
      logger('eapis-adyen').debug({
        message: `Fetched ${response.data.data.length} records`,
        requestId,
        extraInfo: {
          dataSize: response.data.data.length,
          pagesTotal,
          pageNumber,
          pageSize,
          nextPage: pageNumber + 1,
          totalDataFetched,
          adyenData: response.data.data.map((store) => ({
            id: store.id,
            reference: store.reference,
            merchantId: store.merchantId,
            status: store.status,
            description: store.description,
          })),
        },
      })
      pageNumber += 1
    } while (pageNumber <= pagesTotal)
    logger('eapis-adyen').debug({
      message: `Successfully fetched ${data.length} records`,
      requestId,
      extraInfo: {
        totalDataFetched,
      },
    })
    return data
  } catch (error) {
    throw new AppError({
      name: 'ADYEN_API',
      message: 'Error in the fetch call to Adyen API',
      cause: error,
    })
  }
}

export const getAdyenTerminals = async ({
  requestId,
  appEnv,
  opts = {},
}: {
  requestId: string
  appEnv: (typeof APP_ENVS)[number]
  opts: {
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
    let data: AdyenTerminal[] = []
    const pageSize = opts.pageSize || 100
    let pageNumber = 1

    let totalDataFetched = 0
    const queryParams: Record<string, string> = {}
    if (opts.brandModels) {
      queryParams.brandModels = opts.brandModels
    }
    if (opts.merchantIds) {
      queryParams.merchantIds = opts.merchantIds
    }
    if (opts.storeIds) {
      queryParams.storeIds = opts.storeIds
    }
    if (opts.merchantIds) {
      queryParams.merchantId = opts.merchantIds
    }
    if (opts.reference) {
      queryParams.reference = opts.reference
    }

    do {
      logger('eapis-adyen').debug({
        message: `Fetching terminals data with query params`,
        requestId,
        extraInfo: { queryParams },
      })
      const query = `${endpoint}/terminals`
      const response = await axios.get<AdyenTerminalsResponse>(query, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-key': key,
        },
        params: {
          ...queryParams,
          pageSize: pageSize,
          pageNumber,
        },
      })
      pagesTotal = response.data.pagesTotal
      data = [...data, ...response.data.data]
      totalDataFetched += response.data.data.length
      logger('eapis-adyen').debug({
        message: `Fetched ${response.data.data.length} records`,
        requestId,
        extraInfo: {
          dataSize: response.data.data.length,
          pagesTotal,
          pageNumber,
          pageSize,
          nextPage: pageNumber + 1,
          totalDataFetched,
          adyenData: response.data.data.map((terminal) => ({
            id: terminal.id,
            model: terminal.model,
            serialNumber: terminal.serialNumber,
            assignment: terminal.assignment,
            firmwareVersion: terminal.firmwareVersion,
            status: terminal.assignment.status,
            merchantId: terminal.assignment.merchantId,
            companyId: terminal.assignment.companyId,
            storeId: terminal.assignment.storeId,
          })),
        },
      })
      pageNumber += 1
    } while (pageNumber <= pagesTotal)

    logger('eapis-adyen').debug({
      message: `Successfully fetched ${data.length} records`,
      requestId,
      extraInfo: {
        totalDataFetched,
      },
    })
    // logger('eapis-adyen').debug({
    //   message: 'Fetched data',
    //   requestId,
    //   extraInfo: {
    //     data,
    //   },
    // })
    return data
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
