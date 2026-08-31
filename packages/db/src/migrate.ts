import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

/**
 * Programmatic migration runner for production (Docker entrypoint).
 * Dev uses drizzle-kit; both must agree on the journal table/schema
 * configured in drizzle.config.ts.
 */
const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const migrationsFolder = process.env.MIGRATIONS_DIR ?? './migrations'

await migrate(drizzle(url), {
  migrationsFolder,
  migrationsTable: 'personal_template_migrations',
  migrationsSchema: 'drizzle',
})
console.log('migrations applied')
process.exit(0)
