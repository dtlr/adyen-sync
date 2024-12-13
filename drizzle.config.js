import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const { APP_NEON_DATABASE_URI } = process.env

if (!APP_NEON_DATABASE_URI) {
  throw new Error('APP_NEON_DATABASE_URI is not set')
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/neonSchema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: APP_NEON_DATABASE_URI,
  },
  introspect: {
    casing: 'camel',
  },
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations__',
    schema: 'public',
  },
  entities: {
    roles: {
      provider: 'neon',
    },
  },
  schemaFilter: 'public',
})
