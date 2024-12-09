import { logger } from '@/core/utils.js'
import { SyncBaseCommand } from '@/sync-base-command.js'

export class SyncCommand extends SyncBaseCommand<typeof SyncCommand> {
  static description = 'Sync data to/from JDNA or other services'

  // static flags = {
  //   all: Flags.boolean({
  //     description: 'Sync all data',
  //     char: 'a',
  //     default: false,
  //     exclusive: ['stores', 'terminals'],
  //   }),
  // }

  async run(): Promise<void> {
    const { flags } = await this.parse(SyncCommand)
  }
}
