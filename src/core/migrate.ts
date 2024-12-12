import * as neonSchema from '@db/neonSchema.js'
import { migrate } from 'drizzle-orm/neon-serverless/migrator'
import { neonDb } from './db'
import { AppError } from '@/error'

export const migrateDb = async (requestId: string, banner: string) => {
  const connString = process.env['APP_NEON_DATABASE_URI']
  if (!connString) {
    throw new AppError({
      requestId,
      name: 'DATABASE_CONFIG_MISSING',
      message: `Database connection string not found for ${banner}`,
      cause: {
        banner,
        context: 'migrateDb',
      },
    })
  }
  const db = neonDb(connString, {
    schema: neonSchema,
  })

  const fs = await import('node:fs')
  const migrationsPath = `./drizzle/${banner}`

  if (!fs.existsSync(migrationsPath)) {
    throw new AppError({
      requestId,
      name: 'DATABASE_CONFIG_MISSING',
      message: `Migrations folder not found at ${migrationsPath}`,
      cause: {
        banner,
        context: 'migrateDb',
      },
    })
  }

  await migrate(db, { migrationsFolder: `./drizzle/${banner}` })
}
