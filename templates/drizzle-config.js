export const drizzleConfig = (safeName, envVarName) => `
  import 'dotenv/config';
  import { defineConfig } from 'drizzle-kit';
  
  export default defineConfig({
    out: './drizzle/${safeName}',
    schema: './src/db/neonSchema.ts',
    dialect: 'postgresql',
    dbCredentials: {
      url: process.env.${envVarName}!,
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
  });
`
