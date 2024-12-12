import { getJDNAStores, processJDNAStores } from '@core/process/stores.js'
import { getAdyenStores } from '@eapis/adyen'
import { logger } from '@util/logger.js'
import { Hono } from 'hono'
import { env } from 'hono/adapter'
import { adyenTerminalBoardWebhook } from 'types/adyen.js'
import { type APP_ENVS } from '@/constants.js'
import { AppError } from '@/error.js'

const apiV2 = new Hono()
  .get('/readyz', (c) => {
    return c.json({ status: 'ok', requestId: c.get('requestId') })
  })
  .get('/healthz', (c) => {
    return c.json({ status: 'ok', requestId: c.get('requestId') })
  })
  .get('/sync/:target/:banner', async (c) => {
    const { target, banner } = c.req.param()
    const { merchantId } = c.req.query()
    const requestId = c.get('requestId')
    const { APP_ENV } = env<{ APP_ENV: (typeof APP_ENVS)[number] }>(c)

    if (!merchantId) {
      throw new AppError({
        requestId,
        name: 'MISSING_MERCHANT_ID',
        message: 'Merchant ID is required',
      })
    }

    switch (target?.toLowerCase()) {
      case 'terminals': {
        return c.json({ requestId, message: 'Completed terminals sync' }, 200)
      }
      case 'stores': {
        const jdnaStores = await getJDNAStores({
          requestId,
          banner,
          storeEnv: APP_ENV,
        })
        const adyenStores = await getAdyenStores({
          requestId,
          appEnv: APP_ENV,
          opts: {
            merchantIds: merchantId,
          },
        })
        const storeIds = await processJDNAStores({
          requestId,
          banner,
          jdnaStores,
          adyenStores,
        })
        return c.json(
          {
            requestId,
            message: 'Completed stores sync',
            extraInfo: { processedStoreIds: storeIds },
          },
          200,
        )
      }
      default:
        return c.json({ requestId, message: 'Operation not found' }, 404)
    }
  })
  // .post('/terminals/reassign/:id', async (c) => {
  //   const { id } = c.req.param()
  //   const requestId = c.get('requestId')
  //   const { APP_ENV } = env<{ APP_ENV: (typeof APP_ENVS)[number] }>(c)
  // })
  // .delete('/terminals/:id', async (c) => {
  //   const { id } = c.req.param()
  //   const requestId = c.get('requestId')
  //   const { APP_ENV } = env<{ APP_ENV: (typeof APP_ENVS)[number] }>(c)
  // })
  .post('/callback/adyen', async (c) => {
    const body = await c.req.json()
    const parsedBody = adyenTerminalBoardWebhook.safeParse(body)
    if (!parsedBody.success) {
      throw new AppError({
        requestId: c.get('requestId'),
        name: 'ROUTE_ADYEN_WEBBHOOK',
        message: 'Invalid webhook body',
        cause: {
          unprocessedBody: body,
          parsedBody,
          errors: parsedBody.error,
        },
      })
    }
    logger('api-v2').info({
      message: 'Received request',
      requestId: c.get('requestId'),
      body: parsedBody.data,
    })
    return c.json({ requestId: c.get('requestId') })
  })

export default apiV2
