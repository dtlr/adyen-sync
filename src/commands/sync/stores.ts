import { Command } from '@oclif/core'
import { logger } from '../../core/utils.js'

export class SyncStoresCommand extends Command {
  static description = 'Sync stores up to Adyen'

  async run(): Promise<void> {
    logger.info('Syncing stores')
  }
}
