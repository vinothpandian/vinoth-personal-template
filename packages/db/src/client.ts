import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

export type Db = ReturnType<typeof createDb>

function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return drizzle(url, { schema })
}

let instance: Db | undefined

/**
 * Lazy singleton so importing this package (e.g. during a production
 * build) never requires a database connection.
 */
export function getDb(): Db {
  instance ??= createDb()
  return instance
}
