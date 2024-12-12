import { migrateDb } from '@core/migrate'
import { serve } from '@hono/node-server'
import { Flags } from '@oclif/core'
import { createId } from '@paralleldrive/cuid2'
import { logger } from '@util/logger.js'
import { app } from '@web'
import { BaseCommand } from '@/base-cmds/base-command.js'

export class ServeCommand extends BaseCommand<typeof ServeCommand> {
  static description = 'Serve the web app'

  static flags = {
    requestId: Flags.string({
      description: 'The request ID',
      hidden: true,
      default: createId(),
      required: true,
    }),
    port: Flags.integer({
      description: 'The port to serve the app on',
      default: 3000,
      env: 'APP_PORT',
    }),
    banner: Flags.string({
      aliases: ['brand', 'fascia'],
      description: 'The banner to sync',
      env: 'APP_BANNER',
      char: 'b',
      multiple: true,
      delimiter: ',',
      multipleNonGreedy: false,
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ServeCommand)

    if (!Array.isArray(flags.banner)) {
      flags.banner = [flags.banner]
    }
    for (const idx in flags.banner) {
      await migrateDb(flags.requestId, flags.banner[idx])
    }

    const port = flags.port
    logger('commands-serve').info(`Server is running on ${port}`)
    logger('commands-serve').info(`App environment: ${flags['app-env']}`)

    serve({
      fetch: app.fetch,
    })
  }
}
