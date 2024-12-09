import { type JDNAProperty, type APP_ENVS } from '@/constants'
import { getAdyenStores, getJDNAStores, processStores } from '@/core/process/stores'
import { logger } from '@/core/utils'
import { SyncBaseCommand } from '@/sync-base-command.js'

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
      fascia: flags.banner as keyof typeof JDNAProperty | 'all',
      storeEnv: flags['app-env'] as (typeof APP_ENVS)[number],
    })
    const adyenStores = await getAdyenStores({
      requestId: flags.requestId,
      fascia: flags.banner as keyof typeof JDNAProperty | 'all',
      storeEnv: flags['app-env'] as (typeof APP_ENVS)[number],
    })

    logger('commands-sync-stores').info({
      requestId: flags.requestId,
      message: 'Completed local sync',
    })

    if (flags.local) {
      process.exit(0)
    }
    const storeIds = await processStores({
      requestId: flags.requestId,
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
