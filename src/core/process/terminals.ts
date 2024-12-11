import { fetchAdyenData } from '@eapis/adyen.js'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { type AdyenTerminal } from 'types/adyen.js'
import { type APP_ENVS, POSWRKIDS } from '@/constants.js'
import * as jmSchema from '@/db/jmSchema.js'
import * as neonSchema from '@/db/neonSchema.js'
import { AppError } from '@/error.js'
import { findDifference } from '@/util/index.js'
import { logger } from '@/util/logger.js'
export const getAdyenTerminals = async ({
  requestId,
  banner,
  merchantId,
  storeEnv,
}: {
  requestId: string
  banner: string
  merchantId: string
  storeEnv: (typeof APP_ENVS)[number]
}): Promise<AdyenTerminal[]> => {
  logger('get-adyen-terminals').debug({
    requestId,
    message: `Syncing terminals for banner: ${banner}`,
  })
  const terminals = (await fetchAdyenData({
    requestId,
    opts: {
      type: 'terminals',
      merchantIds: merchantId,
    },
    appEnv: storeEnv,
  })) as AdyenTerminal[]
  return terminals
}

export const getJMTerminals = async ({
  requestId,
  banner,
  storeEnv,
}: {
  requestId: string
  banner: string
  storeEnv: (typeof APP_ENVS)[number]
}): Promise<AdyenTerminal[]> => {
  logger('get-jm-terminals').debug({
    requestId,
    message: `Syncing terminals for banner: ${banner}`,
    extraInfo: {
      banner,
      storeEnv,
    },
  })
  return []
}

export const processTerminals = async ({
  requestId,
  adyenTerminals,
  banner,
  merchantId,
  storeEnv,
}: {
  requestId: string
  adyenTerminals: AdyenTerminal[]
  banner: string
  merchantId: string
  storeEnv: (typeof APP_ENVS)[number]
}) => {
  logger('process-terminals').debug({
    requestId,
    message: 'Processing terminals',
    extraInfo: {
      adyenTerminals,
      banner,
      storeEnv,
    },
  })
  const items: neonSchema.InsertInternalTerminal[] = []
  const terminals: {
    name: string
    banner: string
    businessUnitId: string | null
  }[] = []

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

  logger('process-terminals').debug({
    requestId,
    message: `Processing terminals for ${banner}`,
    extraInfo: {
      banner,
      items,
    },
  })
  const tmp = items.filter((item) => item.merchantId === merchantId)
  if (tmp.length === 0) {
    logger('process-terminals').debug({
      requestId,
      message: `No terminals found for ${banner}`,
      extraInfo: {
        banner,
        merchantId,
      },
    })
    return []
  }
  const connString = process.env[`${banner.toUpperCase()}_DATABASE_URI`]
  if (!connString) {
    logger('process-terminals').error({
      requestId,
      message: `No database connection string found for ${banner}`,
    })
    throw new AppError({
      name: 'DATABASE_CONFIG_MISSING',
      requestId,
      message: `No database connection string found for ${banner}`,
    })
  }
  const db = drizzle(connString, { schema: neonSchema })
  await db.transaction(async (tx) => {
    for (const item of tmp) {
      let storeId: string | undefined
      let businessUnitId: string | undefined
      if (item.adyenStoreId) {
        const result = await tx
          .select({ id: neonSchema.stores.id, businessUnitId: neonSchema.stores.aptosStoreCode })
          .from(neonSchema.stores)
          .where(eq(neonSchema.stores.adyenId, item.adyenStoreId))
        if (result && result.length > 0) {
          storeId = result[0].id
          businessUnitId = result[0].businessUnitId
        }
      }
      await tx
        .insert(neonSchema.terminals)
        .values({ ...item, storeId })
        .onConflictDoUpdate({
          target: [neonSchema.terminals.serialNumber],
          set: { ...item, storeId },
        })
      terminals.push({
        name: item.name,
        banner: banner.toUpperCase(),
        businessUnitId: businessUnitId ?? null,
      })
    }
  })
  return terminals
}

export const updateJMDatabase = async ({
  requestId,
  data,
  appEnv,
}: {
  requestId: string
  data: {
    name: string
    banner: string
    businessUnitId: string
  }[]
  appEnv: (typeof APP_ENVS)[number]
}) => {
  logger('update-jm-database').debug({
    requestId,
    message: 'Updating JM database',
    extraInfo: {
      data,
      appEnv,
    },
  })
  let logItem: unknown
  const envInitial = appEnv.toLowerCase() === 'live' ? 'p' : 'q'
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env
  const banner = data[0].banner

  const dtlrDb = drizzle({
    connection: `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT ?? 5432}/dtlr-${appEnv.toLowerCase() === 'live' ? 'prod' : 'qa'}`,
    schema: jmSchema,
    casing: 'snake_case',
  })

  const bannerDb = drizzle({
    connection: `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT ?? 5432}/${banner.toLowerCase()}-${appEnv.toLowerCase() === 'live' ? 'prod' : 'qa'}`,
    schema: jmSchema,
    casing: 'snake_case',
  })

  if (data.length === 0) {
    logger('update-jm-database').debug({
      requestId,
      message: `No terminals found for ${banner}`,
    })
    return []
  }

  try {
    let existingWorkstationIds: string[] = []
    for (const item of data) {
      logItem = item

      logger('terminals-update-jm').info({ message: `Processing ${item}`, requestId, item })
      const bannerInitial = banner.charAt(0).toLowerCase()
      let deviceId: string

      // Gather existing workstations for the business unit
      const dbExistingWorkstations = await dtlrDb
        .select({ deviceId: jmSchema.devDevicePersonalization.deviceId })
        .from(jmSchema.devDevicePersonalization)
        .where(eq(jmSchema.devDevicePersonalization.businessUnitId, item.businessUnitId))
      logger('terminals-update-jm').info({
        message: `Found workstations for ${item}`,
        requestId,
        dbExistingWorkstations,
      })

      if (dbExistingWorkstations.length > 0)
        existingWorkstationIds = dbExistingWorkstations.map(
          (workstation) => workstation.deviceId!.split('-')[1]!,
        )
      logger('terminals-update-jm').info({
        message: `Existing workstation ids for ${item}`,
        requestId,
        existingWorkstationIds,
      })

      // Check if record exists in dev_device_personalization table by serial
      const existingDDP = await dtlrDb
        .select()
        .from(jmSchema.devDevicePersonalization)
        .where(eq(jmSchema.devDevicePersonalization.deviceName, item.name))
        .limit(1)

      if (existingDDP.length > 0) {
        logger('terminals-update-jm').info({
          message: `Existing record found for ${item}`,
          requestId,
          item,
        })
        deviceId = existingDDP[0]!.deviceId!
      } else {
        logger('terminals-update-jm').info({
          message: `Existing record not found for ${item}`,
          requestId,
          item: item.name,
        })

        const availableWorkstationIds = findDifference(
          POSWRKIDS.map((i) => i.padStart(3, '0')),
          existingWorkstationIds,
        )
        logger('terminals-update-jm').info({
          message: `Available workstation ids for ${item}`,
          requestId,
          availableWorkstationIds,
        })

        const newWorkstationId = availableWorkstationIds[0]?.padStart(3, '0')
        if (!newWorkstationId) throw new Error('No new workstation ID found')

        deviceId = `${item.businessUnitId}-${newWorkstationId}`
        logger('terminals-update-jm').info({
          message: `New computed device id for ${item}`,
          requestId,
          deviceId,
        })
      }

      await dtlrDb.transaction(async (tx) => {
        logger('terminals-update-jm').info({
          message: `Preparing to update dev_device_personalization for ${item}`,
          requestId,
          deviceId,
        })

        // Update dev_device_personalization
        await tx
          .insert(jmSchema.devDevicePersonalization)
          .values({
            deviceName: item.name,
            serverUrl: `https://${bannerInitial}m${envInitial}.jdna.io`,
            appId: 'pos',
            deviceId,
            businessUnitId: item.businessUnitId,
            tagBusinessUnitId: item.businessUnitId,
          })
          .onConflictDoUpdate({
            target: [
              jmSchema.devDevicePersonalization.deviceName,
              jmSchema.devDevicePersonalization.tagAppId,
              jmSchema.devDevicePersonalization.tagBusinessUnitId,
              jmSchema.devDevicePersonalization.tagBrand,
              jmSchema.devDevicePersonalization.tagStoreType,
              jmSchema.devDevicePersonalization.tagDeviceType,
              jmSchema.devDevicePersonalization.tagDeviceId,
              jmSchema.devDevicePersonalization.tagCountry,
              jmSchema.devDevicePersonalization.tagState,
            ],
            set: {
              serverUrl: `https://${bannerInitial}m${envInitial}.jdna.io`,
              deviceId,
              businessUnitId: item.businessUnitId,
              tagBusinessUnitId: item.businessUnitId,
            },
          })
        logger('terminals-update-jm').info({
          message: `dev_device_personalization table updated for ${item}`,
          requestId,
          existingDDP,
          item,
        })
      })

      // Using a transaction
      await bannerDb.transaction(async (tx) => {
        logger('terminals-update-jm').info({
          message: `Preparing to update pay_payment_devices for ${item}`,
          requestId,
          deviceId,
        })

        // Update pay_payment_devices
        await tx
          .insert(jmSchema.payPaymentDevices)
          .values({
            id: deviceId + '-pay',
            businessUnitId: item.businessUnitId,
            configName: 'terminal1',
            displayName: `Terminal ${deviceId}`,
            terminalId: item.name,
            displayOrder: 0,
          })
          .onConflictDoUpdate({
            target: [jmSchema.payPaymentDevices.id, jmSchema.payPaymentDevices.businessUnitId],
            set: {
              id: deviceId + '-pay',
              businessUnitId: item.businessUnitId,
              displayName: `Terminal ${deviceId}`,
              terminalId: item.name,
            },
          })
        logger('terminals-update-jm').info({
          message: `pay_payment_devices table updated for ${item}`,
          requestId,
          item,
          data: {
            id: deviceId + '-pay',
            businessUnitId: item.businessUnitId,
            configName: 'terminal1',
            displayName: `Terminal ${deviceId}`,
            terminalId: item.name,
            displayOrder: 0,
          },
        })
        // Update pay_assigned_payment_device
        logger('terminals-update-jm').info({
          message: `Preparing to update pay_assigned_payment_device for ${item}`,
          requestId,
          deviceId,
        })
        await tx
          .insert(jmSchema.payAssignedPaymentDevice)
          .values({
            deviceId,
            businessUnitId: item.businessUnitId,
            paymentDeviceId: deviceId + '-pay',
            permanentFlag: 1,
          })
          .onConflictDoUpdate({
            target: [
              jmSchema.payAssignedPaymentDevice.deviceId,
              jmSchema.payAssignedPaymentDevice.businessUnitId,
            ],
            set: {
              businessUnitId: item.businessUnitId,
              paymentDeviceId: deviceId + '-pay',
              permanentFlag: 1,
            },
          })
        logger('terminals-update-jm').info({
          message: `pay_assigned_payment_device table updated for ${item}`,
          requestId,
          item,
          data: {
            deviceId,
            businessUnitId: item.businessUnitId,
            paymentDeviceId: deviceId + '-pay',
            permanentFlag: 1,
          },
        })
      })
      logger('terminals-update-jm').info({
        message: `Successfully updated ${data.length} records`,
        requestId,
        items: data,
      })
    }
  } catch (error) {
    throw new AppError({
      name: 'UPDATE_DATABASE',
      requestId,
      message: 'Error updating JM database',
      cause: {
        currentItem: logItem,
        error,
      },
    })
  }
}
