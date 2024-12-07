import type { Config } from 'drizzle-kit'
import dotenv from 'dotenv'

dotenv.config()

const requiredEnvVars = [
  'NEON_DB_USER',
  'NEON_DB_PASSWORD',
  'NEON_DB_HOST',
  'NEON_DB_PORT',
  'APP_ENV',
]
const dbName = 'dtlr-' + (process.env.APP_ENV?.toLowerCase() ?? 'dev')

if (!process.env.NEON_DATABASE_URL) {
  // Check individual vars if no connection string
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '))
    process.exit(1)
  }
}

export default {
  schema: './src/db/neon.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.NEON_DATABASE_URL ||
      `postgres://${process.env.NEON_DB_USER}:${process.env.NEON_DB_PASSWORD}@${process.env.NEON_DB_HOST}:${process.env.NEON_DB_PORT}/${dbName}`,
  },
  introspect: {
    casing: 'camel',
  },
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations__',
    schema: 'public',
  },
  schemaFilter: 'public',
  tablesFilter: [
    'pay_payment_devices',
    'pay_assigned_payment_device',
    'dev_device_personalization',
  ],
} satisfies Config
