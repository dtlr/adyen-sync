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
import { APP_ENV, DATABASE_URL, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from './index.js'

export const getDb = () => {
  const dbName = 'dtlr-' + (APP_ENV?.toLowerCase() ?? 'dev')
  const dbPort = DB_PORT ?? 5432
  const connectionString = DATABASE_URL
    ? DATABASE_URL
    : `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${dbPort}/${dbName}`

  return drizzle({ connection: connectionString, casing: 'snake_case' })
}

export const updateDatabase = async (data: [string, string, string][]) => {
  const db = getDb()
  const { APP_ENV } = process.env
  const envInitial = (APP_ENV?.toLowerCase() ?? 'dev').charAt(0).toLowerCase()
  try {
    let existingWorkstationIds: string[] = []
    for (const item of data) {
      logger.info({ message: 'Processing', item })
      const bannerInitial = item[1].charAt(0).toLowerCase()
      // Gather existing workstations for the business unit
      const dbExistingWorkstations = await db
        .select({ deviceId: devDevicePersonalization.deviceId })
        .from(devDevicePersonalization)
        .where(eq(devDevicePersonalization.businessUnitId, item[2]))
      logger.info({ message: 'Found workstations', dbExistingWorkstations })
      if (dbExistingWorkstations.length > 0)
        existingWorkstationIds = dbExistingWorkstations.map(
          (workstation) => workstation.deviceId?.split('-')[1]!,
        )
      logger.info({ message: 'Existing workstation ids', existingWorkstationIds })
      // Using a transaction
      await db.transaction(async (tx) => {
        // Check if record exists in dev_device_personalization table by serial
        const existingDDP = await tx
          .select()
          .from(devDevicePersonalization)
          .where(eq(devDevicePersonalization.deviceName, item[0]))
          .limit(1)
        if (existingDDP.length > 0) {
          logger.info({ message: 'Existing record found for', item: item[0] })
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
          logger.info({ message: 'dev_device_personalization tables updated' })
          // Update pay_payment_devices
          await tx
            .update(payPaymentDevices)
            .set({
              businessUnitId: item[2],
              displayName: `Terminal ${item[2] + '-' + existingDDP[0]!.deviceId?.split('-')[1]!.padStart(3, '0')}`,
            })
            .where(eq(payPaymentDevices.terminalId, item[0]))
          logger.info({ message: 'pay_payment_devices tables updated' })
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
          logger.info({ message: 'pay_assigned_payment_device tables updated' })
        } else {
          logger.info({ message: 'Existing record not found for', item: item[0] })
          const availableWorkstationIds = findDifference(
            posWrkIds.map((i) => i.padStart(3, '0')),
            existingWorkstationIds,
          )
          logger.info({ message: 'Available workstation ids', availableWorkstationIds })
          const newWorkstationId = availableWorkstationIds[0]?.padStart(3, '0')
          if (!newWorkstationId) throw new Error('No new workstation ID found')
          const deviceId = `${item[2]}-${newWorkstationId}`
          logger.info({ message: 'New computed device id', deviceId })
          // Insert dev_device_personalization
          await tx.insert(devDevicePersonalization).values({
            deviceName: item[0],
            serverUrl: `https://${bannerInitial}m${envInitial}.jdna.io`,
            deviceId,
            appId: 'pos',
            businessUnitId: item[2],
            tagBusinessUnitId: item[2],
          })
          // Insert pay_payment_devices
          await tx.insert(payPaymentDevices).values({
            id: deviceId + '-pay',
            businessUnitId: item[2],
            configName: 'terminal1',
            displayName: `Terminal ${deviceId}`,
            terminalId: item[0],
            displayOrder: 0,
          })
          // Insert pay_assigned_payment_device
          await tx.insert(payAssignedPaymentDevice).values({
            deviceId,
            businessUnitId: item[2],
            paymentDeviceId: deviceId + '-pay',
            permanentFlag: 1,
          })
        }
      })
    }
    logger.info({ message: `Successfully updated ${data.length} records` })
  } catch (error) {
    throw new AdyenSyncError({
      name: 'UPDATE_DATABASE',
      message: `Error updating database.`,
      cause: error,
    })
  }
}
