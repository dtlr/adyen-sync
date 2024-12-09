import { Hono } from 'hono'
import { prettyJSON } from 'hono/pretty-json'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { RETAINED_304_HEADERS } from 'hono/etag'
import { etag } from 'hono/etag'
import { HTTPException } from 'hono/http-exception'
import { AdyenSyncError } from '@/error.js'
import { adyenTerminalBoardWebhook } from 'types/adyen.js'
import { webLogger } from '@/core/utils.js'
import { processTerminals } from '@core/process/terminals.js'

export const app = new Hono()

app.use('*', requestId())
app.use(
  '*',
  etag({
    retainedHeaders: ['x-message', ...RETAINED_304_HEADERS],
  }),
)
app.use(prettyJSON())
app.use('*', cors())
app.use('*', secureHeaders())

app.get('/readyz', (c) => {
  webLogger.info({
    message: 'Readyz',
    requestId: c.get('requestId'),
  })
  return c.json({ status: 'ok', requestId: c.get('requestId') })
})

app.post('/callback/adyen', async (c) => {
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
  webLogger.info({
    message: 'Received request',
    requestId: c.get('requestId'),
    body: parsedBody.data,
  })
  return c.json({ requestId: c.get('requestId') })
})

app.get('/fleet', async (c) => {
  const jmData = await processTerminals({
    requestId: c.get('requestId'),
    fascia: 'dtlr',
    storeEnv: 'test',
    adyenTerminals: [],
  })
  return c.json(
    {
      requestId: c.get('requestId'),
      message: 'Fleet is going to be synced',
      data: jmData,
    },
    202,
  )
})

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    webLogger.error({ requestId: c.get('requestId'), message: 'Error caught', error: err })
    return c.json({ message: err.message, requestId: c.get('requestId') }, err.status)
  } else if (err instanceof AdyenSyncError) {
    webLogger.error({ requestId: c.get('requestId'), message: 'Error caught', error: err })
    return c.json({ message: err.message, requestId: c.get('requestId') }, 400)
  } else {
    webLogger.error({ requestId: c.get('requestId'), message: 'Error caught', error: err })
    return c.json(
      {
        name: 'UNHANDLED_ERROR',
        message: 'Error caught',
        requestId: c.get('requestId'),
      },
      500,
    )
  }
})
