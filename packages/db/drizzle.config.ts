import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: fail fast if unset
    url: process.env.DATABASE_URL!,
  },
  // Shared Postgres: never look at (or touch) other apps' tables.
  // Must match TABLE_PREFIX in src/schema.ts.
  tablesFilter: ['personal_template_*'],
  // Per-app migration journal so apps sharing this database don't
  // mix migration histories.
  migrations: {
    table: 'personal_template_migrations',
    schema: 'drizzle',
  },
})
