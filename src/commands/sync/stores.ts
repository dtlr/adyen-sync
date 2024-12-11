import { SyncBaseCommand } from '@/base-cmds/sync-base-command.js'
import { type APP_ENVS } from '@/constants.js'
import { getAdyenStores, getJDNAStores, processJDNAStores } from '@/core/process/stores.js'
import { logger } from '@/util/logger.js'

export class SyncStoresCommand extends SyncBaseCommand<typeof SyncStoresCommand> {
  static description = 'Sync stores'

  async run(): Promise<void> {
    const { flags } = await this.parse(SyncStoresCommand)

    logger('commands-sync-stores').info({
      requestId: flags.requestId,
      message: 'Starting stores sync',
    })

    logger('commands-sync-stores').info({
      requestId: flags.requestId,
      message: 'Starting local sync',
    })
    const jdnaStores = await getJDNAStores({
      requestId: flags.requestId,
      banner: flags.banner,
      storeEnv: flags['app-env'] as (typeof APP_ENVS)[number],
    })
    const adyenStores = await getAdyenStores({
      requestId: flags.requestId,
      merchantId: flags.merchantId,
      storeEnv: flags['app-env'] as (typeof APP_ENVS)[number],
    })

    logger('commands-sync-stores').info({
      requestId: flags.requestId,
      message: 'Completed local sync',
    })

    if (flags.local) {
      process.exit(0)
    }
    const storeIds = await processJDNAStores({
      requestId: flags.requestId,
      banner: flags.banner,
      jdnaStores,
      adyenStores,
    })

    logger('commands-sync-stores').info({
      requestId: flags.requestId,
      message: 'Completed stores sync',
      extraInfo: { processedStoreIds: storeIds },
    })
  }
}
