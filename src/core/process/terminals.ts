import { fetchAdyenData } from '@eapis/adyen.js'
import { AdyenTerminal } from 'types/adyen.js'
import { logger, parseStoreRef } from '../utils.js'
import { APP_ENVS, JDNAProperty } from '@/constants.js'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as neonSchema from '@/db/neonSchema.js'

export const getAdyenTerminals = async ({
  requestId,
  fascia,
  storeEnv,
}: {
  requestId: string
  fascia: keyof typeof JDNAProperty | 'all'
  storeEnv: (typeof APP_ENVS)[number]
}): Promise<AdyenTerminal[]> => {
  logger('get-adyen-terminals').debug({
    requestId,
    message: `Syncing terminals for fascia: ${fascia}`,
  })
  const terminals = (await fetchAdyenData({
    requestId,
    opts: {
      type: 'terminals',
      merchantIds: fascia === 'all' ? undefined : JDNAProperty[fascia],
    },
    appEnv: storeEnv,
  })) as AdyenTerminal[]
  return terminals
}

export const processTerminals = async ({
  requestId,
  adyenTerminals,
  fascia,
  storeEnv,
}: {
  requestId: string
  adyenTerminals: AdyenTerminal[]
  fascia: keyof typeof JDNAProperty | 'all'
  storeEnv: (typeof APP_ENVS)[number]
}): Promise<string[]> => {
  logger('process-terminals').info({ requestId, message: 'Processing terminals' })
  const items: neonSchema.InsertInternalTerminal[] = []
  const terminalIds: string[] = []

  for (const terminal of adyenTerminals) {
    items.push({
      model: terminal.model,
      serialNumber: terminal.serialNumber,
      firmwareVersion: terminal.firmwareVersion,
      companyId: terminal.assignment.companyId,
      merchantId: terminal.assignment.merchantId,
      adyenStoreId: terminal.assignment.storeId,
      status: terminal.assignment.status,
      name: terminal.id,
      cellularIccid: terminal.connectivity?.cellular?.iccid,
      cellularStatus: terminal.connectivity?.cellular?.status,
      ethernetMacAddress: terminal.connectivity?.ethernet?.macAddress,
      ethernetIpAddress: terminal.connectivity?.ethernet?.ipAddress,
      ethernetLinkNegotiation: terminal.connectivity?.ethernet?.linkNegotiation,
      wifiIpAddress: terminal.connectivity?.wifi?.ipAddress,
      wifiMacAddress: terminal.connectivity?.wifi?.macAddress,
      bluetoothMacAddress: terminal.connectivity?.bluetooth?.macAddress,
      bluetoothIpAddress: terminal.connectivity?.bluetooth?.ipAddress,
      lastActivityAt: terminal.lastActivityAt,
      lastTransactionAt: terminal.lastTransactionAt,
      restartLocalTime: terminal.restartLocalTime,
    })
  }

  for (const banner of Object.keys(JDNAProperty)) {
    logger('process-terminals').debug({
      requestId,
      message: `Processing terminals for ${banner}`,
      extraInfo: {
        banner,
        items,
      },
    })
    const tmp = items.filter((item) => item.merchantId === JDNAProperty[banner])
    if (tmp.length === 0) {
      logger('process-terminals').debug({
        requestId,
        message: `No terminals found for ${banner}`,
        extraInfo: {
          banner,
          merchantId: JDNAProperty[banner],
        },
      })
      continue
    }
    const connString = process.env[`${banner.toUpperCase()}_DATABASE_URI`]
    if (!connString) {
      logger('process-terminals').error({
        requestId,
        message: `No database connection string found for ${banner}`,
      })
      continue
    }
    const db = drizzle(connString, { schema: neonSchema })
    await db.transaction(async (tx) => {
      for (const item of tmp) {
        let storeId: string | undefined
        if (item.adyenStoreId) {
          const result = await tx
            .select({ id: neonSchema.stores.id })
            .from(neonSchema.stores)
            .where(eq(neonSchema.stores.adyenId, item.adyenStoreId))
          if (result && result.length > 0) {
            storeId = result[0].id
          }
        }
        await tx
          .insert(neonSchema.terminals)
          .values({ ...item, storeId })
          .onConflictDoUpdate({
            target: [neonSchema.terminals.serialNumber],
            set: { ...item, storeId },
          })
        terminalIds.push(...tmp.map((item) => item.id).filter((id) => id !== undefined))
      }
    })
  }
  return terminalIds
}
