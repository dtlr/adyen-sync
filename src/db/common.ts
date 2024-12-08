import { timestamp } from 'drizzle-orm/pg-core'

export const commonTime = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
  deletedAt: timestamp('deleted_at'),
}
