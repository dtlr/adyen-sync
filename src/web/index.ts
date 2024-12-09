import { Hono } from 'hono'
import { prettyJSON } from 'hono/pretty-json'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { RETAINED_304_HEADERS } from 'hono/etag'
import { etag } from 'hono/etag'
import { HTTPException } from 'hono/http-exception'
import { AdyenSyncError } from '@/error.js'
import { webLogger } from '@/core/utils.js'
import apiV2 from './api-v2.js'
import ui from './ui.jsx'
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

app.route('/', ui)
app.route('/v2', apiV2)

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

export default app
