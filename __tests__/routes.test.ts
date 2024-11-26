import { describe, it, expect, vi, beforeEach, afterAll, afterEach, beforeAll } from 'vitest'
import { app } from './../src/index';
import { fetchAdyenData } from '../src/adyen'
import { updateDatabase } from '../src/db'

import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  http.get('*/adyen/api', () => {
    return HttpResponse.json({
      // Mock response data structure
      data: {
        terminals: []
      }
    })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

vi.mock('../src/db', () => ({
  updateDatabase: vi.fn()
}))

describe('API Routes', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  describe('GET /readyz', () => {
    it('should return 200 status with ok message', async () => {
      const res = await app.request('/readyz')
      expect(res.status).toBe(200)
      
      const json = await res.json()
      expect(json).toEqual({ status: 'ok' })
    })
  })

  describe('POST /callback/adyen', () => {
    it.skip('should accept valid webhook payload', async () => {
      const validPayload = {
        type: 'terminal.boarded',
        createdAt: '2024-03-20T10:00:00Z',
        environment: 'TEST',
        data: {
          companyId: 'comp_123',
          merchantId: 'merch_123',
          storeId: 'store_123',
          uniqueTerminalId: 'term_123'
        }
      }

      const res = await app.request('/callback/adyen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validPayload)
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toHaveProperty('requestId')
    })

    it.skip('should reject invalid webhook payload', async () => {
      const invalidPayload = {
        type: 'terminal.boarded',
        // Missing required fields
      }

      const res = await app.request('/callback/adyen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidPayload)
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /fleet', () => {
    it.skip('should process store and terminal data successfully', async () => {
      // Mock the Adyen API responses
      const mockStores = [{
        id: 'store_123',
        reference: 'ABC123',
        description: 'Test Store'
      }]

      const mockTerminals = [{
        id: 'term_123',
        model: 'S1E2L',
        assignment: {
          status: 'BOARDED',
          storeId: 'store_123'
        }
      }]

      // Setup mocks
      vi.mocked(fetchAdyenData).mockImplementation(async (_, options) => {
        if (options?.type === 'terminals') {
          return mockTerminals
        }
        return mockStores
      })

      vi.mocked(updateDatabase).mockResolvedValue(undefined)

      const res = await app.request('/fleet')
      expect(res.status).toBe(200)
      
      const json = await res.json()
      expect(json).toHaveProperty('message', 'Fleet is going to be synced')
      expect(json).toHaveProperty('requestId')

      // Verify API calls
      expect(fetchAdyenData).toHaveBeenCalledTimes(2)
      expect(updateDatabase).toHaveBeenCalledTimes(1)
    })

    it.skip('should handle missing store reference', async () => {
      // Mock invalid store data
      const mockStores = [{
        id: 'store_123',
        reference: null, // Invalid reference
        description: 'Test Store'
      }]

      const mockTerminals = [{
        id: 'term_123',
        model: 'S1E2L',
        assignment: {
          status: 'BOARDED',
          storeId: 'store_123'
        }
      }]

      vi.mocked(fetchAdyenData).mockImplementation(async (_, options) => {
        if (options?.type === 'terminals') {
          return mockTerminals
        }
        return mockStores
      })

      const res = await app.request('/fleet')
      expect(res.status).toBe(400)
    })
  })
})