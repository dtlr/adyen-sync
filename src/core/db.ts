import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import ws from 'ws'

export const neonDb = (connString: string, ...args: unknown[]) =>
  drizzleNeon({
    connection: connString,
    ws: ws,
    ...args,
  })

interface JmDbArgs {
  DB_USER: string
  DB_PASSWORD: string
  DB_HOST: string
  DB_PORT?: string | undefined
}

export const jmDb = (connDetails: JmDbArgs, dbName: string, ...args: unknown[]) =>
  drizzlePg({
    connection: `postgres://${connDetails.DB_USER}:${connDetails.DB_PASSWORD}@${connDetails.DB_HOST}:${connDetails.DB_PORT ?? 5432}/${dbName}`,
    ...args,
  })
