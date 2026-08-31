# personal-template

A boring, single-user full-stack TypeScript template. One authenticated web app, one backend, one database, one CLI/TUI, shared typed contracts. Clone it, rename the table prefix, add your domain later.

## Stack

- **Bun workspaces** monorepo
- **TanStack Start** (Vite + Nitro) — the web app *is* the backend
- **Chakra UI v3**
- **Better Auth** with **Pocket ID** (OIDC) for browser login
- **oRPC** contract-first procedures, shared by web and CLI
- **OpenTUI** terminal UI
- **Postgres + Drizzle** with prefix-based table separation
- **Zod**, **Biome**, **bun test**

## Repository layout

```
apps/
  web/         TanStack Start app: Chakra UI, Better Auth routes, oRPC server
  cli/         CLI (status command) and OpenTUI interactive mode
packages/
  contracts/   oRPC contract + Zod schemas (the only API surface clients see)
  domain/      pure helpers (identity gate, token comparison) + tests
  db/          Drizzle schema, migrations, lazy db client
```

Boundaries: clients call the backend only through oRPC; only the backend touches the database; validation and auth checks live server-side. oRPC is an internal contract, not a public API.

## Shared Postgres, table separation

All apps share one Postgres server (and can share one database). Every table this app owns is prefixed `personal_template_` via Drizzle's `pgTableCreator`, and `drizzle.config.ts` sets `tablesFilter: ['personal_template_*']` plus a namespaced migration journal (`drizzle.personal_template_migrations`) so `drizzle-kit` never sees or touches other apps' tables.

To reuse this template for a new app: change `TABLE_PREFIX` in `packages/db/src/schema.ts` **and** the matching `tablesFilter` + `migrations.table` in `packages/db/drizzle.config.ts`, delete `packages/db/migrations/`, and regenerate.

## Local setup

`./bootstrap.sh` (Ubuntu or macOS) checks that `bun`, `just`, `gh`, and `docker` are installed (stops if any is missing), runs `bun install`, starts local Postgres via Docker, and turns on branch protection (CI must pass before a PR to main merges). Then `cp .env.example .env`, `just migrate`, `just dev`.

Manual path:

1. Install [Bun](https://bun.sh) and have Docker running.
2. `bun install`
3. Start Postgres and create the env file:

   ```sh
   just db-up                # docker compose up -d --wait db
   cp .env.example .env      # then fill in real values
   ```

   The Docker Postgres matches `.env.example`'s `DATABASE_URL` out of the box (user `vinoth`, db `personal_template`, port `127.0.0.1:5432`). Use `127.0.0.1`, not `localhost`, in the URL.

4. Run migrations: `bun run db:migrate`
5. Start the app: `bun run dev` → http://localhost:3000

### Pocket ID configuration

In your Pocket ID admin, create an OIDC client:

- **Callback URL**: `http://localhost:3000/api/auth/callback/pocket-id` (adjust host for production; the provider id `pocket-id` is set in `apps/web/src/server/auth.ts`)
- Copy the client ID/secret into `.env`, and set `POCKET_ID_ISSUER_URL` to your Pocket ID base URL.

Only the identity in `ALLOWED_EMAIL` / `ALLOWED_SUBJECT` can ever sign in; user creation is blocked for everyone else, and with neither set nobody can sign in (fail closed). There is no registration, password login, or user management — by design.

## Environment variables

All documented with placeholders in [.env.example](.env.example):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (shared server, prefixed tables) |
| `BETTER_AUTH_SECRET` | Better Auth signing secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Base URL of the web app |
| `POCKET_ID_ISSUER_URL` | Pocket ID base URL (OIDC issuer) |
| `POCKET_ID_CLIENT_ID` | OIDC client id from Pocket ID |
| `POCKET_ID_CLIENT_SECRET` | OIDC client secret from Pocket ID |
| `ALLOWED_EMAIL` | The one email allowed to sign in |
| `ALLOWED_SUBJECT` | Optional: the one OIDC `sub` allowed to sign in |
| `WORKER_TOKEN` | Static bearer token for the CLI (`openssl rand -hex 32`) |
| `API_URL` | CLI only: where the web app is running |

## Commands

With [just](https://just.systems) installed, `just` lists every recipe — it loads `.env` automatically, so `just status`, `just tui`, `just migrate`, `just psql`, and `just verify` need no manual exports. First-time setup is `just setup`; `just check` runs typecheck + lint + test + build.

The underlying bun scripts:

| Command | What it does |
| --- | --- |
| `bun install` | install all workspaces |
| `bun run dev` | start the web app (loads root `.env`) |
| `bun run build` | production build of every workspace |
| `bun run typecheck` | TypeScript across all workspaces |
| `bun run test` | bun test (domain package) |
| `bun run lint` | Biome check (`bun run lint:fix` to auto-fix) |
| `bun run db:generate` | generate a migration from schema changes |
| `bun run db:migrate` | apply migrations |

`db:*` commands need `DATABASE_URL` exported (e.g. `export $(grep -v '^#' .env | xargs)`).

## Using the CLI

The CLI authenticates with `WORKER_TOKEN` only — no interactive login.

```sh
cd apps/cli
export $(grep -v '^#' ../../.env | xargs)

bun run src/index.ts status   # one-shot health check, prints JSON
bun run src/index.ts tui      # interactive OpenTUI view (r refresh, q quit)
```

## Deployment

### Web app on Coolify

The root `Dockerfile` is Coolify-ready: create an Application from this repo with the Dockerfile build pack, port `3000`. The container applies pending migrations on boot, then serves.

Set these env vars in Coolify (same names as `.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (your public URL, e.g. `https://app.example.com`), `POCKET_ID_ISSUER_URL`, `POCKET_ID_CLIENT_ID`, `POCKET_ID_CLIENT_SECRET`, `ALLOWED_EMAIL`/`ALLOWED_SUBJECT`, `WORKER_TOKEN`.

Then add the production callback URL to the Pocket ID client: `https://app.example.com/api/auth/callback/pocket-id`.

### CLI on a remote machine

The CLI compiles to a single self-contained binary (no bun/node needed on the target).

**Quick install (Linux x64):** CI publishes the binary as a GitHub release asset on every `v*` tag. On the target machine:

```sh
curl -fsSL https://raw.githubusercontent.com/vinothpandian/vinoth-personal-template/main/install.sh | bash
```

It downloads `pt-cli` to `/usr/local/bin` (or `~/.local/bin`), prompts for `API_URL` and `WORKER_TOKEN`, and appends them as exports to `~/.zshenv` or `~/.bashrc`. Pre-set those env vars to skip the prompts.

**Build it yourself:**

```sh
just build-cli          # for this machine's OS/arch → dist/pt-cli
just build-cli-linux    # for a Linux server (via Docker) → dist/linux/pt-cli
```

Copy the binary over and run it with two env vars:

```sh
scp dist/linux/pt-cli server:/usr/local/bin/pt-cli
ssh server 'API_URL=https://app.example.com WORKER_TOKEN=<token> pt-cli status'
```

## Verification

With the dev server running:

```sh
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/
# 307 http://localhost:3000/login          (unauthenticated → login)

curl -s -X POST http://localhost:3000/api/rpc/health/check \
  -H 'content-type: application/json' -d '{}'
# {"json":{...,"code":"UNAUTHORIZED","status":401,...}}   (no token → 401)

cd apps/cli && bun run src/index.ts status
# {"status":"ok","database":"ok",...,"authenticatedAs":"worker"}
```
