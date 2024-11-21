import type { Config } from 'drizzle-kit'
import dotenv from 'dotenv'

dotenv.config()

const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME']

if (!process.env.DATABASE_URL) {
  // Check individual vars if no connection string
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '))
    process.exit(1)
  }
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
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
