import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/neonSchema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.APP_NEON_DATABASE_URI,
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
});
