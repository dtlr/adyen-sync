import { Command } from '@oclif/core'
import { logger } from '../../core/utils.js'

export class SyncCommand extends Command {
  static description = 'Sync data to/from Adyen or other services'

  async run(): Promise<void> {
    logger.info('Syncing data')
  }
}
