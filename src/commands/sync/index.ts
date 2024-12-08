import { BaseCommand } from '@/base-command.js'
import { APP_ENVS, JDNAProperty } from '@/constants.js'
import { processStores } from '@/core/process/stores.js'
import { processTerminals } from '@/core/process/terminals.js'
import { cliLogger } from '@/core/utils.js'
import { Flags } from '@oclif/core'
import { createId } from '@paralleldrive/cuid2'

export class SyncCommand extends BaseCommand<typeof SyncCommand> {
  static description = 'Sync data to/from Adyen or other services'

  static flags = {
    stores: Flags.boolean({
      description: 'Sync stores',
      default: false,
      exclusive: ['terminals'],
      required: true,
    }),
    terminals: Flags.boolean({
      description: 'Sync terminals',
      default: false,
      exclusive: ['stores'],
      required: true,
    }),
    fascia: Flags.string({
      aliases: ['banner', 'brand', 'b'],
      description: 'The fascia to sync stores for',
      char: 'f',
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

    if (flags.stores) {
      cliLogger.info({ requestId, message: 'Starting stores sync' })
      await processStores({
        requestId,
        fascia: flags.fascia as (typeof JDNAProperty)[number] | 'all',
        store_env: flags['app-env'] as (typeof APP_ENVS)[number],
      })
      cliLogger.info({ requestId, message: 'Completed stores sync' })
    }

    if (flags.terminals) {
      cliLogger.info({ requestId, message: 'Starting terminals sync' })
      const jmData = await processTerminals({ requestId })
      cliLogger.info({ requestId, message: 'Completed terminals sync' })
    }
  }
}
