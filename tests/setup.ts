import { http } from 'msw'

import { HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterEach, beforeAll, afterAll } from 'vitest'

const server = setupServer(
  http.get('*/adyen/api', () => {
    return HttpResponse.json({
      // Mock response data structure
      data: {
        terminals: [],
      },
    })
  }),
)

beforeAll(() => {
  import.meta.env.APP_ENV = 'qa'
  server.listen({ onUnhandledRequest: 'error' })
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

export { server }
