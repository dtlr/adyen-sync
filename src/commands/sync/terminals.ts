import { type APP_ENVS, type JDNAPropertyKey } from '@/constants'
import { getAdyenTerminals, processTerminals, updateJMDatabase } from '@/core/process/terminals'
import { logger } from '@/core/utils'
import { SyncBaseCommand } from '@/sync-base-command.js'

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
    const adyenTerminals = await getAdyenTerminals({
      requestId: flags.requestId,
      fascia: flags.banner as JDNAPropertyKey | 'all',
      storeEnv: flags['app-env'] as (typeof APP_ENVS)[number],
    })
    const terminals = await processTerminals({
      requestId: flags.requestId,
      adyenTerminals,
      fascia: flags.banner as JDNAPropertyKey | 'all',
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

    logger('commands-sync-terminals').info({
      requestId: flags.requestId,
      message: 'Completed terminals sync',
    })
  }
}
