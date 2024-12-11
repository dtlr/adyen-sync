import { serve } from '@hono/node-server'
import { Flags } from '@oclif/core'
import { logger } from '@util/logger.js'
import { app } from '@web'
import { BaseCommand } from '@/base-cmds/base-command.js'

export class ServeCommand extends BaseCommand<typeof ServeCommand> {
  static description = 'Serve the web app'

  static flags = {
    port: Flags.integer({
      description: 'The port to serve the app on',
      default: 3000,
      env: 'APP_PORT',
    }),
  }

  async run(): Promise<void> {
    await this.config.runHook('migration', {
      requestId: 'serve-command',
      id: 'serve-command',
    })
    const { flags } = await this.parse(ServeCommand)

    const port = flags.port
    logger('commands-serve').info(`Server is running on ${port}`)
    logger('commands-serve').info(`App environment: ${flags['app-env']}`)

    serve({
      fetch: app.fetch,
    })
  }
}
