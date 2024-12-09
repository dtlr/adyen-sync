import { localLocationSchema } from 'types'
import { z } from 'zod'

export type AdyenRecord = { id: string; merchantId: string }

export const adyenLocationSchema = z.object({
  id: z.string(),
  value: localLocationSchema.omit({
    location_short_name: true,
    location_code: true,
    active_flag: true,
  }),
})
export type AdyenLocation = z.infer<typeof adyenLocationSchema>

const adyenLinksSchema = z.object({
  first: z.object({
    href: z.string(),
  }),
  last: z.object({
    href: z.string(),
  }),
  next: z.object({
    href: z.string(),
  }),
  self: z.object({
    href: z.string(),
  }),
})
export type AdyenLinks = z.infer<typeof adyenLinksSchema>

export const adyenTerminalResponseSchema = z.object({
  _links: adyenLinksSchema,
  itemsTotal: z.number(),
  pagesTotal: z.number(),
  data: z.array(
    z.object({
      id: z.string(),
      model: z.string(),
      serialNumber: z.string(),
      lastActivityAt: z.string().optional(),
      lastTransactionAt: z.string().optional(),
      restartLocalTime: z.string().optional(),
      firmwareVersion: z.string().optional(),
      assignment: z.object({
        companyId: z.string(),
        merchantId: z.string(),
        storeId: z.string(),
        status: z.string(),
        reassignmentTarget: z
          .object({
            inventory: z.boolean(),
          })
          .optional(),
      }),
      connectivity: z.object({
        bluetooth: z
          .object({
            ipAddress: z.string().optional(),
            macAddress: z.string().optional(),
          })
          .optional(),
        cellular: z
          .object({
            status: z.string().optional(),
            iccid: z.string().optional(),
          })
          .optional(),
        ethernet: z
          .object({
            macAddress: z.string().optional(),
            ipAddress: z.string().optional(),
            linkNegotiation: z.string().optional(),
          })
          .optional(),
        wifi: z
          .object({
            ipAddress: z.string().optional(),
            macAddress: z.string().optional(),
          })
          .optional(),
      }),
    }),
  ),
})
export type AdyenTerminalsResponse = z.infer<typeof adyenTerminalResponseSchema>
export type AdyenTerminal = z.infer<typeof adyenTerminalResponseSchema>['data'][number]

export const adyenStoresResponseSchema = z.object({
  _links: adyenLinksSchema,
  itemsTotal: z.number(),
  pagesTotal: z.number(),
  data: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      reference: z.string(),
      status: z.string(),
      merchantId: z.string(),
      phoneNumber: z.string(),
      address: z.object({
        city: z.string(),
        line1: z.string(),
        line2: z.string(),
        line3: z.string(),
        postalCode: z.string(),
        stateOrProvince: z.string(),
        country: z.string(),
      }),
      _links: adyenLinksSchema.pick({ self: true }),
    }),
  ),
})
export type AdyenStoresResponse = z.infer<typeof adyenStoresResponseSchema>
export type AdyenStore = z.infer<typeof adyenStoresResponseSchema>['data'][number]

export const adyenTerminalBoardWebhook = z.object({
  type: z.string(),
  createdAt: z.string(),
  environment: z.string(),
  data: z.object({
    companyId: z.string(),
    merchantId: z.string(),
    storeId: z.string(),
    uniqueTerminalId: z.string(),
  }),
})

export type AdyenStoreCreate = {
  id: string
  address: {
    country: string
    line1: string
    line2: string
    line3: string
    city: string
    stateOrProvince: string
    postalCode: string
  }
  description: string
  merchantId: string
  shopperStatement: string
  phoneNumber: string
  reference: string
  status: string
  _links: {
    self: {
      href: string
    }
  }
}

export type AdyenStoresReturn = {
  _links: {
    first?: {
      href: string
    }
    last?: {
      href: string
    }
    next?: {
      href: string
    }
    self: {
      href: string
    }
  }
  itemsTotal: number
  pagesTotal: number
  data: {
    address: {
      city: string
      line1: string
      postalCode: string
      stateOrProvince: string
      country: string
    }
    description: string
    externalReferenceId: string
    merchantId: string
    phoneNumber: string
    reference: string
    shopperStatement: string
    status: string
    id: string
    _links: {
      first?: {
        href: string
      }
      last?: {
        href: string
      }
      self: {
        href: string
      }
    }
  }[]
}
