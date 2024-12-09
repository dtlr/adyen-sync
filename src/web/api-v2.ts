import { APP_ENVS, JDNAProperty } from '@/constants'
import { getJDNAStores, getAdyenStores, processStores } from '@/core/process/stores'
import { logger } from '@/core/utils'
import { AdyenSyncError } from '@/error'
import { adyenTerminalBoardWebhook } from '@/types/adyen'
import { Hono } from 'hono'
import { env } from 'hono/adapter'

const apiV2 = new Hono()
  .get('/readyz', (c) => {
    return c.json({ status: 'ok', requestId: c.get('requestId') })
  })
  .get('/sync/:operation?', async (c) => {
    const { operation } = c.req.param()
    let { banner } = c.req.query()
    const requestId = c.get('requestId')
    const { APP_ENV } = env<{ APP_ENV: (typeof APP_ENVS)[number] }>(c)

    if (banner && Object.keys(JDNAProperty).includes(banner.toLowerCase())) {
      banner = banner.toLowerCase()
    } else {
      banner = 'all'
    }

    switch (operation?.toLowerCase()) {
      case 'terminals': {
        return c.json({ requestId, message: 'Completed terminals sync' }, 200)
      }
      case 'stores': {
        const jdnaStores = await getJDNAStores({
          requestId,
          fascia: banner ?? 'all',
          storeEnv: APP_ENV,
        })
        const adyenStores = await getAdyenStores({
          requestId,
          fascia: banner ?? 'all',
          storeEnv: APP_ENV,
        })
        const storeIds = await processStores({
          requestId,
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
  .post('/callback/adyen', async (c) => {
    const body = await c.req.json()
    const parsedBody = adyenTerminalBoardWebhook.safeParse(body)
    if (!parsedBody.success) {
      throw new AdyenSyncError({
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
