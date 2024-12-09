import { logger, findDifference } from '@core/utils.js'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  devDevicePersonalization,
  payAssignedPaymentDevice,
  payPaymentDevices,
} from '../db/schema.js'
import { POSWRKIDS } from '@/constants.js'
import { AdyenSyncError } from '@/error.js'

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, APP_ENV } = process.env

const dtlrConnectionString = `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT ?? 5432}/dtlr-${APP_ENV?.toLowerCase() ?? 'dev'}`
const dtlrDb = drizzle({ connection: dtlrConnectionString, casing: 'snake_case' })

const spcConnectionString = `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT ?? 5432}/spc-${APP_ENV?.toLowerCase() ?? 'dev'}`
const spcDb = drizzle({ connection: spcConnectionString, casing: 'snake_case' })

export const updateJMDatabase = async ({
  requestId,
  data,
}: {
  requestId: string
  data: [string, string, string][]
}) => {
  const { APP_ENV } = process.env
  const envInitial = (APP_ENV?.toLowerCase() ?? 'dev').charAt(0).toLowerCase()
  let logItem: unknown
  try {
    let existingWorkstationIds: string[] = []
    for (const item of data) {
      logItem = item
      logger('db').info({ message: `Processing ${item}`, requestId, item })
      const bannerInitial = item[1].charAt(0).toLowerCase()
      let deviceId: string

      // Gather existing workstations for the business unit
      const dbExistingWorkstations = await dtlrDb
        .select({ deviceId: devDevicePersonalization.deviceId })
        .from(devDevicePersonalization)
        .where(eq(devDevicePersonalization.businessUnitId, item[2]))
      logger('db').info({
        message: `Found workstations for ${item}`,
        requestId,
        dbExistingWorkstations,
      })

      if (dbExistingWorkstations.length > 0)
        existingWorkstationIds = dbExistingWorkstations.map(
          (workstation) => workstation.deviceId!.split('-')[1]!,
        )
      logger('db').info({
        message: `Existing workstation ids for ${item}`,
        requestId,
        existingWorkstationIds,
      })

      // Check if record exists in dev_device_personalization table by serial
      const existingDDP = await dtlrDb
        .select()
        .from(devDevicePersonalization)
        .where(eq(devDevicePersonalization.deviceName, item[0]))
        .limit(1)

      if (existingDDP.length > 0) {
        logger('db').info({
          message: `Existing record found for ${item}`,
          requestId,
          item,
        })
        deviceId = existingDDP[0]!.deviceId!
      } else {
        logger('db').info({
          message: `Existing record not found for ${item}`,
          requestId,
          item: item[0],
        })

        const availableWorkstationIds = findDifference(
          POSWRKIDS.map((i) => i.padStart(3, '0')),
          existingWorkstationIds,
        )
        logger('db').info({
          message: `Available workstation ids for ${item}`,
          requestId,
          availableWorkstationIds,
        })

        const newWorkstationId = availableWorkstationIds[0]?.padStart(3, '0')
        if (!newWorkstationId) throw new Error('No new workstation ID found')

        deviceId = `${item[2]}-${newWorkstationId}`
        logger('db').info({ message: `New computed device id for ${item}`, requestId, deviceId })
      }
      await dtlrDb.transaction(async (tx) => {
        logger('db').info({
          message: `Preparing to update dev_device_personalization for ${item}`,
          requestId,
          deviceId,
        })
        // Update dev_device_personalization
        await tx
          .insert(devDevicePersonalization)
          .values({
            deviceName: item[0],
            serverUrl: `https://${bannerInitial}m${envInitial}.jdna.io`,
            appId: 'pos',
            deviceId,
            businessUnitId: item[2],
            tagBusinessUnitId: item[2],
          })
          .onConflictDoUpdate({
            target: [
              devDevicePersonalization.deviceName,
              devDevicePersonalization.tagAppId,
              devDevicePersonalization.tagBusinessUnitId,
              devDevicePersonalization.tagBrand,
              devDevicePersonalization.tagStoreType,
              devDevicePersonalization.tagDeviceType,
              devDevicePersonalization.tagDeviceId,
              devDevicePersonalization.tagCountry,
              devDevicePersonalization.tagState,
            ],
            set: {
              serverUrl: `https://${bannerInitial}m${envInitial}.jdna.io`,
              deviceId,
              businessUnitId: item[2],
              tagBusinessUnitId: item[2],
            },
          })
        logger('db').info({
          message: `dev_device_personalization table updated for ${item}`,
          requestId,
          existingDDP,
          item,
        })
      })

      if (item[1].toLowerCase() === 'dtlr') {
        // Using a transaction
        await dtlrDb.transaction(async (tx) => {
          logger('db').info({
            message: `Preparing to update pay_payment_devices for ${item}`,
            requestId,
            deviceId,
          })
          // Update pay_payment_devices
          await tx
            .insert(payPaymentDevices)
            .values({
              id: deviceId + '-pay',
              businessUnitId: item[2],
              configName: 'terminal1',
              displayName: `Terminal ${deviceId}`,
              terminalId: item[0],
              displayOrder: 0,
            })
            .onConflictDoUpdate({
              target: [payPaymentDevices.id, payPaymentDevices.businessUnitId],
              set: {
                id: deviceId + '-pay',
                businessUnitId: item[2],
                displayName: `Terminal ${deviceId}`,
                terminalId: item[0],
              },
            })
          logger('db').info({
            message: `pay_payment_devices table updated for ${item}`,
            requestId,
            item,
            data: {
              id: deviceId + '-pay',
              businessUnitId: item[2],
              configName: 'terminal1',
              displayName: `Terminal ${deviceId}`,
              terminalId: item[0],
              displayOrder: 0,
            },
          })
          // Update pay_assigned_payment_device
          logger('db').info({
            message: `Preparing to update pay_assigned_payment_device for ${item}`,
            requestId,
            deviceId,
          })
          await tx
            .insert(payAssignedPaymentDevice)
            .values({
              deviceId,
              businessUnitId: item[2],
              paymentDeviceId: deviceId + '-pay',
              permanentFlag: 1,
            })
            .onConflictDoUpdate({
              target: [payAssignedPaymentDevice.deviceId, payAssignedPaymentDevice.businessUnitId],
              set: {
                businessUnitId: item[2],
                paymentDeviceId: deviceId + '-pay',
                permanentFlag: 1,
              },
            })
          logger('db').info({
            message: `pay_assigned_payment_device table updated for ${item}`,
            requestId,
            item,
            data: {
              deviceId,
              businessUnitId: item[2],
              paymentDeviceId: deviceId + '-pay',
              permanentFlag: 1,
            },
          })
        })
      }
      if (item[1].toLowerCase() === 'spc') {
        // Using a transaction
        await spcDb.transaction(async (tx) => {
          logger('db').info({
            message: `Preparing to update pay_payment_devices for ${item}`,
            requestId,
            deviceId,
          })
          // Update pay_payment_devices
          await tx
            .insert(payPaymentDevices)
            .values({
              id: deviceId + '-pay',
              businessUnitId: item[2],
              configName: 'terminal1',
              displayName: `Terminal ${deviceId}`,
              terminalId: item[0],
              displayOrder: 0,
            })
            .onConflictDoUpdate({
              target: [payPaymentDevices.id, payPaymentDevices.businessUnitId],
              set: {
                id: deviceId + '-pay',
                businessUnitId: item[2],
                displayName: `Terminal ${deviceId}`,
                terminalId: item[0],
              },
            })
          logger('db').info({
            message: `pay_payment_devices table updated for ${item}`,
            requestId,
            item,
            data: {
              id: deviceId + '-pay',
              businessUnitId: item[2],
              configName: 'terminal1',
              displayName: `Terminal ${deviceId}`,
              terminalId: item[0],
              displayOrder: 0,
            },
          })
          // Update pay_assigned_payment_device
          logger('db').info({
            message: `Preparing to update pay_assigned_payment_device for ${item}`,
            requestId,
            deviceId,
          })
          await tx
            .insert(payAssignedPaymentDevice)
            .values({
              deviceId,
              businessUnitId: item[2],
              paymentDeviceId: deviceId + '-pay',
              permanentFlag: 1,
            })
            .onConflictDoUpdate({
              target: [payAssignedPaymentDevice.deviceId, payAssignedPaymentDevice.businessUnitId],
              set: {
                businessUnitId: item[2],
                paymentDeviceId: deviceId + '-pay',
                permanentFlag: 1,
              },
            })
          logger('db').info({
            message: `pay_assigned_payment_device table updated for ${item}`,
            requestId,
            item,
            data: {
              deviceId,
              businessUnitId: item[2],
              paymentDeviceId: deviceId + '-pay',
              permanentFlag: 1,
            },
          })
        })
      }
    }
    logger('db').info({
      message: `Successfully updated ${data.length} records`,
      requestId,
      items: data,
    })
  } catch (error) {
    throw new AdyenSyncError({
      name: 'UPDATE_DATABASE',
      requestId,
      message: `Error updating database.`,
      cause: {
        currentItem: logItem,
        error,
      },
    })
  }
}
