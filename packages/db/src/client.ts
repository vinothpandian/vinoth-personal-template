import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return url
}

export const db = drizzle(requireDatabaseUrl(), { schema })

export type Db = typeof db
