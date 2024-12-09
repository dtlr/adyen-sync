import { logger } from '@core/utils.js'
import * as neonSchema from '@db/neonSchema.js'
import { type Hook } from '@oclif/core'
import { migrate } from 'drizzle-orm/neon-serverless/migrator'
import { drizzle } from 'drizzle-orm/node-postgres'
import 'dotenv/config'

const hook: Hook<'migration'> = async function (options) {
  const { DTLR_DATABASE_URI, SPC_DATABASE_URI } = process.env

  logger('hook-migration').debug({
    message: 'Running migrations for DTLR database',
    requestId: options.requestId,
  })
  const dtlrDb = drizzle(DTLR_DATABASE_URI!, { schema: neonSchema })
  await migrate(dtlrDb, { migrationsFolder: './drizzle/dtlr' })

  logger('hook-migration').debug({
    message: 'Running migrations for SPC database',
    requestId: options.requestId,
  })
  const spcDb = drizzle(SPC_DATABASE_URI!, { schema: neonSchema })
  await migrate(spcDb, { migrationsFolder: './drizzle/spc' })
}

export default hook
