# Loads .env automatically, so db/cli recipes need no manual exports.

set dotenv-load

# list all recipes
default:
    @just --list

# --- setup -------------------------------------------------------------------

# install all workspace dependencies
install:
    @bun install

# create the local database and apply migrations (first-time setup)
setup: install
    createdb -h 127.0.0.1 personal_template || true
    just migrate

# --- develop -----------------------------------------------------------------

# start the web app dev server → http://localhost:3000
dev:
    @bun run dev

# --- cli ---------------------------------------------------------------------

# one-shot health check (JSON, authenticates with WORKER_TOKEN)
status:
    @cd apps/cli && bun run src/index.ts status

# interactive terminal UI (r refresh, q quit)
tui:
    @cd apps/cli && bun run src/index.ts tui

# --- database ----------------------------------------------------------------

# generate a migration from schema changes
generate:
    @cd packages/db && bunx drizzle-kit generate

# apply pending migrations
migrate:
    @cd packages/db && bunx drizzle-kit migrate

# open a psql shell on this app's database
psql:
    psql "$DATABASE_URL"

# --- quality -----------------------------------------------------------------

# typecheck every workspace
typecheck:
    @bun run typecheck

# run all tests
test:
    @bun test

# lint (biome)
lint:
    @bun run lint

# lint and auto-fix
fix:
    @bun run lint:fix

# production build of every workspace
build:
    @bun run build

# typecheck + lint + test + build
check: typecheck lint test build

# --- verify ------------------------------------------------------------------

# smoke-test a running dev server: redirect, 401 without token, CLI health
verify:
    @printf 'unauthenticated / : '
    @curl -s -o /dev/null -w '%{http_code} → %{redirect_url}\n' http://localhost:3000/
    @printf 'rpc without token : '
    @curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/rpc/health/check -H 'content-type: application/json' -d '{}'
    @printf 'cli with token    : '
    @just status
