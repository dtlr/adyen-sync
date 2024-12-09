import { type JDNAProperty, type APP_ENVS } from '@/constants'
import {
  getAdyenTerminals,
  getJMTerminals,
  processTerminals,
  updateJMDatabase,
} from '@/core/process/terminals'
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
      fascia: flags.banner as keyof typeof JDNAProperty | 'all',
      storeEnv: flags['app-env'] as (typeof APP_ENVS)[number],
    })
    const jmTerminals = await getJMTerminals({
      requestId: flags.requestId,
      fascia: flags.banner as keyof typeof JDNAProperty | 'all',
      storeEnv: flags['app-env'] as (typeof APP_ENVS)[number],
    })
    const terminalIds = await processTerminals({
      requestId: flags.requestId,
      adyenTerminals,
      fascia: flags.banner as keyof typeof JDNAProperty | 'all',
      storeEnv: flags['app-env'] as (typeof APP_ENVS)[number],
    })
    logger('commands-sync-terminals').info({
      requestId: flags.requestId,
      message: 'Completed local sync',
      extraInfo: { processedTerminalIds: terminalIds },
    })
    if (flags.local) {
      process.exit(0)
    }
    await updateJMDatabase({
      requestId: flags.requestId,
      data: terminalIds.map((id) => [id, 'terminal', '']),
      appEnv: flags['app-env'] as (typeof APP_ENVS)[number],
    })

    logger('commands-sync-terminals').info({
      requestId: flags.requestId,
      message: 'Completed terminals sync',
    })
  }
}
