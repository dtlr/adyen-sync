import { Command } from '@oclif/core'
import { createRequestID, logger } from '../../core/utils.js'
import { processTerminals } from '../../core/process/terminals.js'

export class SyncTerminalsCommand extends Command {
  static description = 'Sync terminals from Adyen'

  async run(): Promise<void> {
    logger.info('Syncing terminals')
    const requestId = createRequestID()
    const jmData = await processTerminals({ requestId })
    logger.info({ requestId, message: 'Processed terminals', jmData })
  }
}
