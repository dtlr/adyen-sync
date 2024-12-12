import { z } from 'zod'

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

export const adyenStoreCreateSchema = z.object({
  address: z.object({
    country: z.string(),
    line1: z.string(),
    line2: z.string(),
    line3: z.string().optional(),
    city: z.string(),
    stateOrProvince: z.string(),
    postalCode: z.string(),
  }),
  description: z.string(),
  merchantId: z.string(),
  shopperStatement: z.string(),
  phoneNumber: z.string(),
  reference: z.string(),
})
export type AdyenStoreCreate = z.infer<typeof adyenStoreCreateSchema>

export const adyenStoresReturnSchema = z.object({
  _links: z.object({
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
  }),
  itemsTotal: z.number(),
  pagesTotal: z.number(),
  data: z.array(
    z.object({
      address: z.object({
        city: z.string(),
        line1: z.string(),
        postalCode: z.string(),
        stateOrProvince: z.string(),
        country: z.string(),
      }),
      description: z.string(),
      externalReferenceId: z.string(),
      merchantId: z.string(),
      phoneNumber: z.string(),
      reference: z.string(),
      shopperStatement: z.string(),
      status: z.string(),
      id: z.string(),
      _links: z.object({
        first: z.object({
          href: z.string(),
        }),
        self: z.object({
          href: z.string(),
        }),
      }),
    }),
  ),
})
export type AdyenStoresReturn = z.infer<typeof adyenStoresReturnSchema>
