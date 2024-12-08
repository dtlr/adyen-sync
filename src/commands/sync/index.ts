import { BaseCommand } from '@/base-command.js'
import { APP_ENVS, JDNAProperty } from '@/constants.js'
import { getJDNAStores, processStores } from '@/core/process/stores.js'
import { getJDNATerminals, processTerminals } from '@/core/process/terminals.js'
import { logger } from '@/core/utils.js'
import { Flags } from '@oclif/core'
import { createId } from '@paralleldrive/cuid2'

export class SyncCommand extends BaseCommand<typeof SyncCommand> {
  static description = 'Sync data to/from JDNA or other services'

  static flags = {
    all: Flags.boolean({
      description: 'Sync all data',
      char: 'a',
      default: false,
      exclusive: ['stores', 'terminals'],
    }),
    stores: Flags.boolean({
      description: 'Sync stores from local database. Specify --full to do a complete sync.',
      char: 's',
      default: false,
      allowNo: true,
      exclusive: ['all'],
      required: true,
    }),
    terminals: Flags.boolean({
      description: 'Sync terminals from local database. Specify --full to do a complete sync.',
      char: 't',
      default: false,
      allowNo: true,
      exclusive: ['all'],
      required: true,
    }),
    local: Flags.boolean({
      description: 'Sync data to local database',
      char: 'l',
      default: false,
      hidden: true,
    }),
    full: Flags.boolean({
      description: 'Re-sync all data',
      char: 'f',
      default: false,
    }),
    banner: Flags.string({
      aliases: ['brand', 'fascia'],
      description: 'The banner to sync',
      char: 'b',
      multiple: false,
      default: 'all',
      options: [...JDNAProperty, 'all'] as const,
      required: true,
    }),
  }

  async run(): Promise<void> {
    const requestId = createId()
    await this.config.runHook('migration', { requestId, id: 'sync-command' })
    const { flags } = await this.parse(SyncCommand)

    if (flags.all) {
      flags.stores = true
      flags.terminals = true
    }

    if (flags.full) {
      flags.local = true
    }

    if (flags.local) {
      logger('commands-sync').info({ requestId, message: 'Starting local sync' })
      const jdnaStores = await getJDNAStores({
        requestId,
        fascia: flags.banner as (typeof JDNAProperty)[number] | 'all',
        store_env: flags['app-env'] as (typeof APP_ENVS)[number],
      })
      const jdnaTerminals = await getJDNATerminals({
        requestId,
        fascia: flags.banner as (typeof JDNAProperty)[number] | 'all',
        store_env: flags['app-env'] as (typeof APP_ENVS)[number],
      })
      const storeIds = await processStores({ requestId, jdnaStores })
      const terminalIds = await processTerminals({
        requestId,
        jdnaTerminals,
        fascia: flags.banner as (typeof JDNAProperty)[number] | 'all',
        store_env: flags['app-env'] as (typeof APP_ENVS)[number],
      })
      logger('commands-sync').info({
        requestId,
        message: 'Completed local sync',
        extraInfo: { processedStoreIds: storeIds, processedTerminalIds: terminalIds },
      })
    }

    if (flags.stores) {
      logger('commands-sync').info({ requestId, message: 'Starting stores sync' })
      logger('commands-sync').info({ requestId, message: 'Completed stores sync' })
    }

    if (flags.terminals) {
      logger('commands-sync').info({ requestId, message: 'Starting terminals sync' })
      const jmData = await processTerminals({ requestId })
      logger('commands-sync').info({ requestId, message: 'Completed terminals sync' })
    }
  }
}
