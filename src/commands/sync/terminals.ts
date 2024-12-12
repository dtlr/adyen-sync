import { migrateDb } from '@core/migrate'
import { getAdyenTerminals, processTerminals, updateJMDatabase } from '@core/process/terminals.js'
import { logger } from '@util/logger.js'
import { SyncBaseCommand } from '@/base-cmds/sync-base-command.js'
import { type APP_ENVS } from '@/constants.js'

export class SyncTerminalsCommand extends SyncBaseCommand<typeof SyncTerminalsCommand> {
  static description = 'Sync terminals'

  async run(): Promise<void> {
    const { flags } = await this.parse(SyncTerminalsCommand)

    logger('commands-sync-terminals').info({
      requestId: flags.requestId,
      message: 'Starting terminals sync',
    })

    logger('commands-sync-terminals').info({
      requestId: flags.requestId,
      message: 'Starting local sync',
    })

    if (!Array.isArray(flags.banner)) {
      flags.banner = [flags.banner]
    }
    if (!Array.isArray(flags.merchantId)) {
      flags.merchantId = [flags.merchantId]
    }

    for (const idx in flags.banner) {
      await migrateDb(flags.requestId, flags.banner[idx])

      const adyenTerminals = await getAdyenTerminals({
        requestId: flags.requestId,
        banner: flags.banner[idx],
        merchantId: flags.merchantId[idx],
        storeEnv: flags['app-env'] as (typeof APP_ENVS)[number],
      })
      const terminals = await processTerminals({
        requestId: flags.requestId,
        adyenTerminals,
        banner: flags.banner[idx],
        merchantId: flags.merchantId[idx],
        storeEnv: flags['app-env'] as (typeof APP_ENVS)[number],
      })
      logger('commands-sync-terminals').info({
        requestId: flags.requestId,
        message: 'Completed local sync',
        extraInfo: { processedTerminalIds: terminals },
      })
      if (flags.local) {
        process.exit(0)
      }
      await updateJMDatabase({
        requestId: flags.requestId,
        data: terminals.filter(
          (item) => item.name.startsWith('S1E2L') && item.businessUnitId !== null,
        ) as {
          name: string
          banner: string
          businessUnitId: string
        }[],
        appEnv: flags['app-env'] as (typeof APP_ENVS)[number],
      })
    }

    logger('commands-sync-terminals').info({
      requestId: flags.requestId,
      message: 'Completed terminals sync',
    })
  }
}
