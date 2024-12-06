import { Command } from '@oclif/core'
import { logger } from '../core/utils.js'
import { app } from '../web/index.js'
import { serve } from '@hono/node-server'

export class ServeCommand extends Command {
  static description = 'Serve the web app'

  async run(): Promise<void> {
    const { APP_PORT, APP_ENV } = process.env

    const port = parseInt(APP_PORT || '3000')
    logger.info(`Server is running on ${port}`)
    logger.info(`App environment: ${APP_ENV}`)

    serve({
      fetch: app.fetch,
    })
  }
}
