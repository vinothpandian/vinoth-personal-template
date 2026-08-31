# Loads .env automatically, so db/cli recipes need no manual exports.

set dotenv-load

# list all recipes
default:
    @just --list

# --- setup -------------------------------------------------------------------

# install all workspace dependencies
install:
    @bun install

# start local Postgres, apply migrations (first-time setup)
setup: install db-up
    just migrate

# start local Postgres (Docker) and wait until it accepts connections
db-up:
    docker compose up -d --wait db

# stop local Postgres (keeps the data volume)
db-down:
    docker compose down

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

# open a psql shell on the local Docker database
psql:
    docker compose exec db psql -U vinoth -d personal_template

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

# --- production --------------------------------------------------------------

# compile the CLI to a standalone binary for THIS machine → dist/pt-cli
build-cli:
    @mkdir -p dist
    @cd apps/cli && bun build --compile src/index.ts --outfile ../../dist/pt-cli
    @echo "dist/pt-cli — copy to a machine of the same OS/arch; needs API_URL and WORKER_TOKEN env vars"

# compile the CLI for a Linux server via Docker → dist/linux/pt-cli
build-cli-linux:
    docker build --target=cli --output=dist/linux .
    @echo "dist/linux/pt-cli — copy to the server; needs API_URL and WORKER_TOKEN env vars"

# build the web app Docker image (what Coolify builds from the repo)
docker-build:
    docker build -t personal-template .

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
