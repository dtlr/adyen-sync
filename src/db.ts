import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import {
  devDevicePersonalization,
  payAssignedPaymentDevice,
  payPaymentDevices,
} from './db/schema.js'
import { findDifference, posWrkIds } from './utils.js'
import { AdyenSyncError } from './error.js'
import { logger } from './utils.js'

const {
  DATABASE_URL,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  APP_ENV,
} = process.env

const dtlrConnectionString = `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT ?? 5432}/dtlr-${APP_ENV?.toLowerCase() ?? 'dev'}`
const dtlrDb = drizzle({ connection: dtlrConnectionString, casing: 'snake_case' })

const spcConnectionString = `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT ?? 5432}/spc-${APP_ENV?.toLowerCase() ?? 'dev'}`
const spcDb = drizzle({ connection: spcConnectionString, casing: 'snake_case' })

export const updateDatabase = async ({
  requestId,
  data,
}: {
  requestId: string
  data: [string, string, string][]
}) => {
  const { APP_ENV } = process.env
  const envInitial = (APP_ENV?.toLowerCase() ?? 'dev').charAt(0).toLowerCase()
  try {
    let existingWorkstationIds: string[] = []
    for (const item of data) {
      logger.info({ message: `Processing ${item[0]}`, requestId, item })
      const bannerInitial = item[1].charAt(0).toLowerCase()
      let deviceId: string
      // Gather existing workstations for the business unit
      const dbExistingWorkstations = await dtlrDb
        .select({ deviceId: devDevicePersonalization.deviceId })
        .from(devDevicePersonalization)
        .where(eq(devDevicePersonalization.businessUnitId, item[2]))
      logger.info({ message: `Found workstations for ${item[0]}`, dbExistingWorkstations })
      
      if (dbExistingWorkstations.length > 0)
        existingWorkstationIds = dbExistingWorkstations.map(
          (workstation) => workstation.deviceId?.split('-')[1]!,
        )
      logger.info({ message: `Existing workstation ids for ${item[0]}`, requestId, existingWorkstationIds })

      // Check if record exists in dev_device_personalization table by serial
      const existingDDP = await dtlrDb
        .select()
        .from(devDevicePersonalization)
        .where(eq(devDevicePersonalization.deviceName, item[0]))
        .limit(1)

      if (existingDDP.length > 0) {
        logger.info({
          message: `Existing record found for ${item[0]}`,
          requestId,
          item,
        })
        await dtlrDb.transaction(async (tx) => {
          // Update dev_device_personalization
          await tx
          .update(devDevicePersonalization)
          .set({
            serverUrl: `https://${bannerInitial}m${envInitial}.jdna.io`,
            appId: 'pos',
            deviceId: item[2] + '-' + existingDDP[0]!.deviceId?.split('-')[1]!.padStart(3, '0'),
            businessUnitId: item[2],
            tagBusinessUnitId: item[2],
            })
            .where(eq(devDevicePersonalization.deviceName, item[0]))
          logger.info({
            message: `dev_device_personalization tables updated for ${item[0]}`,
            requestId,
            existingDDP,
            item,
          })
        })
      } else {
        logger.info({ message: `Existing record not found for ${item[0]}`, requestId, item: item[0] })

        const availableWorkstationIds = findDifference(
            posWrkIds.map((i) => i.padStart(3, '0')),
            existingWorkstationIds,
          )
          logger.info({
            message: `Available workstation ids for ${item[0]}`,
            requestId,
            availableWorkstationIds,
          })
          
          const newWorkstationId = availableWorkstationIds[0]?.padStart(3, '0')
          if (!newWorkstationId) throw new Error('No new workstation ID found')
          
          deviceId = `${item[2]}-${newWorkstationId}`
          logger.info({ message: `New computed device id for ${item[0]}`, requestId, deviceId })
          
          // Insert dev_device_personalization
          await dtlrDb.insert(devDevicePersonalization).values({
            deviceName: item[0],
            serverUrl: `https://${bannerInitial}m${envInitial}.jdna.io`,
            deviceId,
            appId: 'pos',
            businessUnitId: item[2],
            tagBusinessUnitId: item[2],
        })
      }

      if (item[1].toLowerCase() === 'dtlr') {
        // Using a transaction
        await dtlrDb.transaction(async (tx) => {
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
              target: [payPaymentDevices.terminalId],
              set: {
                businessUnitId: item[2],
              },
            })
          logger.info({
            message: `pay_payment_devices tables updated for ${item[0]}`,
            requestId,
            existingDDP,
            item,
          })
          // Update pay_assigned_payment_device
          await tx
            .insert(payAssignedPaymentDevice)
            .values({
              deviceId,
              businessUnitId: item[2],
              paymentDeviceId: deviceId + '-pay',
              permanentFlag: 1,
            })
            .onConflictDoUpdate({
              target: [payAssignedPaymentDevice.deviceId],
              set: {
                businessUnitId: item[2],
                permanentFlag: 1,
              },
            })
          logger.info({
            message: `pay_assigned_payment_device tables updated for ${item[0]}`,
            requestId,
            existingDDP,
            item,
          })
        })
      }
      if (item[1].toLowerCase() === 'spc') {
        // Using a transaction
        await spcDb.transaction(async (tx) => {
            // Update pay_payment_devices
            await tx
              .update(payPaymentDevices)
              .set({
                businessUnitId: item[2],
                displayName: `Terminal ${item[2] + '-' + existingDDP[0]!.deviceId?.split('-')[1]!.padStart(3, '0')}`,
              })
              .where(eq(payPaymentDevices.terminalId, item[0]))
            logger.info({
              message: `pay_payment_devices tables updated for ${item[0]}`,
              requestId,
              existingDDP,
              item,
            })
            // Update pay_assigned_payment_device
            await tx
              .update(payAssignedPaymentDevice)
              .set({
                businessUnitId: item[2],
                permanentFlag: 1,
              })
              .where(
                eq(
                  payAssignedPaymentDevice.deviceId,
                  item[2] + '-' + existingDDP[0]!.deviceId?.split('-')[1]!.padStart(3, '0'),
                ),
              )
            logger.info({
              message: `pay_assigned_payment_device tables updated for ${item[0]}`,
              requestId,
              existingDDP,
              item,
            })
        })
      }
    }
    logger.info({
      message: `Successfully updated ${data.length} records`,
      requestId,
      items: data,
    })
  } catch (error) {
    throw new AdyenSyncError({
      name: 'UPDATE_DATABASE',
      requestId,
      message: `Error updating database.`,
      cause: error,
    })
  }
}
