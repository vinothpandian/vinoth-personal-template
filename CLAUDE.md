# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Always use ponytail for implementation — this is important

For ANY coding task (writing, adding, refactoring, fixing, reviewing, or designing code), invoke the `ponytail` skill first and follow it. If the Skill tool doesn't list it, read `.agents/skills/ponytail/SKILL.md` (`.claude/skills/` symlinks there). Gist: the laziest solution that actually works — YAGNI → reuse what's in the codebase → stdlib → native platform feature → already-installed dependency → minimal code. Sibling skills exist for specific jobs: `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain` (managed via `skills-lock.json`).

## Commands

Prefer `just` — it loads `.env` automatically, so db/cli recipes need no manual exports. `just` alone lists all recipes.

- `just dev` — web app dev server → http://localhost:3000
- `just check` — typecheck + lint + test + build (run before claiming work done)
- `just generate` / `just migrate` — drizzle-kit migration from schema changes / apply
- `just status` / `just tui` — CLI health check / OpenTUI interactive mode
- `just verify` — smoke-test a running dev server (redirect, 401, CLI auth)

Raw bun equivalents exist as root `package.json` scripts, but `bun run db:*` needs `DATABASE_URL` exported, and the raw CLI needs `API_URL`/`WORKER_TOKEN`. Single test file: `bun test packages/domain/src/index.test.ts`. Lint autofix: `bun run lint:fix` (Biome).

## Architecture

Bun workspaces monorepo; TanStack Start (Vite + Nitro) web app *is* the backend. Setup, env vars, and deployment are documented in README.md.

**Contract-first RPC flow.** Adding a procedure touches three places, in order:
1. `packages/contracts/src/schemas.ts` — Zod schemas
2. `packages/contracts/src/index.ts` — the oRPC contract (the only API surface clients see)
3. `apps/web/src/server/orpc.ts` — implementation, behind the `requireAuth` middleware

Both clients (web + CLI) call the same procedures through this contract. Clients never touch the database; validation and auth live server-side. oRPC is internal, not a public API.

**Dual principals, one middleware.** `resolvePrincipal` in `apps/web/src/server/orpc.ts` accepts either a Better Auth session cookie (browser, via Pocket ID OIDC) or `Authorization: Bearer $WORKER_TOKEN` (CLI). Procedures see `{ kind: 'user' | 'worker' }`.

**Single-user, fail closed.** Only `ALLOWED_EMAIL`/`ALLOWED_SUBJECT` can sign in (`apps/web/src/server/auth.ts`); with neither set, nobody can. No registration or user management — by design.

**Dev auth bypass.** Set `AUTH_DEV_BYPASS=1` (in `.env`) to skip Pocket ID: every route guard and RPC sees a mock signed-in user (`isAuthBypass` in `packages/domain`). Gated off when `NODE_ENV=production`. Use it for implementing/testing behind the auth wall; `just verify` will fail while it's on.

**Shared Postgres, prefixed tables.** One Postgres server shared by multiple apps. Every table is prefixed `personal_template_` via `pgTableCreator` (`packages/db/src/schema.ts`), and `drizzle.config.ts` scopes `tablesFilter` + the migration journal so drizzle-kit never touches other apps' tables. Reusing the template = change `TABLE_PREFIX` + `tablesFilter` + `migrations.table`, delete `packages/db/migrations/`, regenerate. Use `127.0.0.1`, not `localhost`, in `DATABASE_URL`.

**Pure logic lives in `packages/domain`** (identity gate, constant-time token comparison) — the only tested package; put new pure helpers and their tests there.
