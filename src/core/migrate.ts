import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as neonSchema from '@db/neonSchema.js'
import { migrate } from 'drizzle-orm/neon-serverless/migrator'
import { neonDb } from './db'
import { AppError } from '@/error'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const migrateDb = async (requestId: string, banner: string) => {
  const { APP_NEON_DATABASE_URI } = process.env
  if (!APP_NEON_DATABASE_URI) {
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
  const db = neonDb(APP_NEON_DATABASE_URI, {
    schema: neonSchema,
  })

  const fs = await import('node:fs')
  const migrationsPath = `./drizzle`

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

  try {
    await migrate(db, { migrationsFolder: `./drizzle` })
  } catch (error) {
    throw new AppError({
      requestId,
      name: 'DATABASE_CONFIG_MISSING',
      message: `Failed to migrate database for ${banner}`,
      cause: {
        file: __filename,
        dir: __dirname,
        banner,
        context: 'migrateDb',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'Unknown stack',
      },
    })
  }
}
