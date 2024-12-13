import { migrateDb } from '@core/migrate'
import { processAdyenStores, processJDNAStores } from '@core/stores.js'
import { getAdyenStores } from '@eapis/adyen.js'
import { getJDNAStores } from '@eapis/jdna.js'
import { logger } from '@util/logger.js'
import { SyncBaseCommand } from '@/base-cmds/sync-base-command.js'
import { type APP_ENVS } from '@/constants.js'

export class SyncStoresCommand extends SyncBaseCommand<typeof SyncStoresCommand> {
  static description = 'Sync stores'

  static examples = [
    {
      description: 'Sync stores for a single banner in the test environment',
      command:
        '<%= config.bin %> <%= command.id %> --banner=banner1 --merchantId=merchant1 --app-env=test',
    },
    {
      description: 'Sync stores for multiple banners in the live environment',
      command:
        '<%= config.bin %> <%= command.id %> --banner=banner1,banner2 --merchantId=merchant1,merchant2 --app-env=live',
    },
  ]

  async run(): Promise<void> {
    const { flags } = await this.parse(SyncStoresCommand)
    let storeIds: string[] = []

    if (this.jsonEnabled()) {
      this.log('Starting stores sync', {
        context: 'commands-sync-stores',
        requestId: flags.requestId,
      })
    } else {
      this.log('Starting stores sync')
    }

    if (!Array.isArray(flags.banner)) {
      flags.banner = [flags.banner]
    }
    if (!Array.isArray(flags.merchantId)) {
      flags.merchantId = [flags.merchantId]
    }

    for (const idx in flags.banner) {
      await migrateDb(flags.requestId, flags.banner[idx])

      const jdnaStores = await getJDNAStores({
        requestId: flags.requestId,
        appEnv: flags['app-env'] as (typeof APP_ENVS)[number],
        banner: flags.banner[idx],
      })
      const adyenStores = await getAdyenStores({
        requestId: flags.requestId,
        appEnv: flags['app-env'] as (typeof APP_ENVS)[number],
        opts: {
          merchantIds: flags.merchantId[idx],
        },
      })
      logger('commands-sync-stores').info({
        requestId: flags.requestId,
        message: 'Completed local sync',
      })

      storeIds = await processJDNAStores({
        requestId: flags.requestId,
        banner: flags.banner[idx],
        jdnaStores,
        adyenStores,
      })

      if (flags.local) {
        process.exit(0)
      }

      await processAdyenStores({
        requestId: flags.requestId,
        banner: flags.banner[idx],
        merchantId: flags.merchantId[idx],
        appEnv: flags['app-env'] as (typeof APP_ENVS)[number],
      })
    }

    logger('commands-sync-stores').info({
      requestId: flags.requestId,
      message: 'Completed stores sync',
      extraInfo: { processedStoreIds: storeIds },
    })
  }
}
