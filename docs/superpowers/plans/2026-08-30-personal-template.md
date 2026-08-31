# Single-User TypeScript Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A boring, clonable single-user full-stack monorepo template: one TanStack Start web app (Chakra UI, Better Auth + Pocket ID OIDC), one OpenTUI CLI (WORKER_TOKEN auth), shared oRPC contracts, one Postgres database with Drizzle prefix-based table separation.

**Architecture:** The TanStack Start app *is* the backend — it hosts Better Auth routes and the oRPC handler as server routes. The CLI is a second client of the same oRPC contract, authenticating with a static bearer token. `packages/contracts` owns the oRPC contract + Zod schemas; `packages/db` owns schema/migrations/access; `packages/domain` holds pure helpers only.

**Tech Stack:** Bun 1.3 workspaces, TypeScript, @tanstack/react-start (Vite 8 + nitro), Chakra UI v3, Better Auth 1.7 (genericOAuth plugin for Pocket ID), oRPC 1.15 (contract-first), @opentui/core+react 0.5, drizzle-orm 0.45 + drizzle-kit, Zod 4, Biome (lint), bun test.

**Spec:** The user's message of 2026-08-30 (this repo has no separate spec file; requirements restated in Global Constraints).

## Global Constraints

- Single personal user. NO multi-tenancy, orgs, roles, teams, invitations, billing, registration, password login, profiles, settings screens, user management, device flow, setup wizards.
- No domain features. Only generic health/status views and procedures.
- Table separation for shared Postgres: `pgTableCreator` with compile-time prefix constant `personal_template_` in `packages/db`; `tablesFilter: ["personal_template_*"]` in drizzle.config.ts so drizzle-kit never touches other apps' tables.
- Clients never touch the DB; CLI never imports server internals; validation lives in contracts/domain only; backend owns persistence + authz.
- CLI auth: `Authorization: Bearer $WORKER_TOKEN` only, compared timing-safely on the server.
- Web auth: Better Auth genericOAuth ("pocket-id" provider), sign-in restricted to `ALLOWED_EMAIL`/`ALLOWED_SUBJECT` via a user-creation hook (blocked creation ⇒ no second user can ever exist).
- DATABASE_URL uses `127.0.0.1`, not `localhost` (Postgres.app rejects ::1 without a permission dialog).
- Installed node_modules types are the source of truth over any API name in this plan.
- Env vars documented in `.env.example`: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, POCKET_ID_ISSUER_URL, POCKET_ID_CLIENT_ID, POCKET_ID_CLIENT_SECRET, ALLOWED_EMAIL, ALLOWED_SUBJECT, WORKER_TOKEN, API_URL (CLI).

---

### Task 1: Repo skeleton + root tooling

**Files:**
- Create: `.gitignore`, `package.json` (workspaces + root scripts), `tsconfig.base.json`, `biome.json`, `.env.example`, `README.md` (stub, finished in Task 7)

**Interfaces:**
- Produces: workspaces `apps/*`, `packages/*`; root scripts `dev`, `build`, `typecheck`, `test`, `lint`, `db:generate`, `db:migrate`.

- [ ] Step 1: `git init` done. Write `.gitignore` (node_modules, .env*, !.env.example, dist, .nitro, .output, .tanstack, routeTree.gen.ts kept?, *.log, .DS_Store).
- [ ] Step 2: Root `package.json` with `"workspaces": ["apps/*", "packages/*"]`, scripts fanning out via `bun run --filter`.
- [ ] Step 3: `tsconfig.base.json` strict bundler-mode config shared by packages.
- [ ] Step 4: `biome.json` with lint + format rules.
- [ ] Step 5: Commit.

### Task 2: packages/contracts

**Files:**
- Create: `packages/contracts/package.json`, `src/index.ts`, `src/schemas.ts`, `tsconfig.json`

**Interfaces:**
- Produces: `contract` (oRPC contract with `health.check` procedure), `HealthStatus` zod schema `{ status: 'ok', database: 'ok' | 'error', time: string(iso), authenticatedAs: 'user' | 'worker' }`.

- [ ] Step 1: Zod schemas in `schemas.ts`.
- [ ] Step 2: `oc.router({ health: { check: oc.output(HealthStatus) } })` style contract (verify against installed @orpc/contract types).
- [ ] Step 3: Typecheck package; commit.

### Task 3: packages/db + packages/domain

**Files:**
- Create: `packages/db/package.json`, `src/schema.ts` (prefixed auth tables + `app_meta` table), `src/client.ts`, `src/index.ts`, `drizzle.config.ts`, `migrations/`
- Create: `packages/domain/package.json`, `src/index.ts` (pure helpers: `isAllowedIdentity(email, sub, allowed)`, timing-safe token compare)

**Interfaces:**
- Produces: `db` (drizzle client), `TABLE_PREFIX = 'personal_template_'`, `pgTable` creator, Better Auth tables keyed `user/session/account/verification`, `appMeta` table.

- [ ] Step 1: Generate Better Auth schema via `bunx @better-auth/cli generate` against a temp auth config; wrap output in `pgTableCreator((n) => \`personal_template_${n}\`)`.
- [ ] Step 2: `drizzle.config.ts` with `tablesFilter: ['personal_template_*']`.
- [ ] Step 3: `bun run db:generate` to emit SQL migration; create local DB `personal_template`; `db:migrate` applies it.
- [ ] Step 4: domain helpers + bun tests for `isAllowedIdentity` and token compare.
- [ ] Step 5: Run tests, typecheck, commit.

### Task 4: apps/web — TanStack Start + Chakra + Better Auth + oRPC server

**Files:**
- Create: `apps/web/package.json`, `vite.config.ts`, `tsconfig.json`, `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx` (authenticated home), `src/routes/login.tsx`, `src/routes/api/auth/$.ts` (Better Auth handler), `src/routes/api/rpc.$.ts` (oRPC RPCHandler), `src/server/auth.ts`, `src/server/orpc.ts` (router implementing contract + auth middleware), `src/lib/auth-client.ts`, `src/lib/orpc-client.ts`

**Interfaces:**
- Consumes: `contract` from @template/contracts, `db` from @template/db, helpers from @template/domain.
- Produces: HTTP endpoints `/api/auth/*`, `/api/rpc/*`; auth middleware accepting session cookie OR worker bearer token; `context.principal: { kind: 'user' } | { kind: 'worker' }`.

- [ ] Step 1: Copy probe scaffold shape; add Chakra Provider in root; strip tailwind, use Chakra only.
- [ ] Step 2: `src/server/auth.ts`: betterAuth with drizzleAdapter (schema keys user/session/account/verification), genericOAuth plugin `providerId: 'pocket-id'` with discovery from POCKET_ID_ISSUER_URL, `databaseHooks.user.create.before` rejecting non-allowed identity.
- [ ] Step 3: Server routes for auth + rpc (verify current server-route API from installed @tanstack/react-start types).
- [ ] Step 4: oRPC implementation: `implement(contract)` with middleware resolving principal (session via auth.api.getSession, or timing-safe WORKER_TOKEN check); `health.check` runs `select 1` + reads/writes `app_meta`.
- [ ] Step 5: Routes: `/login` public (button → authClient.signIn.oauth2), `/` protected via `beforeLoad` session check → redirect to /login; shows health via oRPC client; logout button.
- [ ] Step 6: Typecheck, build, commit.

### Task 5: apps/cli — OpenTUI + command mode

**Files:**
- Create: `apps/cli/package.json`, `tsconfig.json`, `src/index.ts` (arg parsing: `status`, `tui`, `--help`), `src/client.ts` (oRPC client with Bearer WORKER_TOKEN), `src/tui.tsx` (OpenTUI health view)

**Interfaces:**
- Consumes: `contract` types from @template/contracts only (no server imports).
- Produces: `bun run --filter cli start status` prints health JSON; `... start tui` opens interactive view.

- [ ] Step 1: oRPC client (RPCLink to `${API_URL}/api/rpc` with Authorization header).
- [ ] Step 2: `status` command printing formatted health.
- [ ] Step 3: OpenTUI view (verify installed @opentui/react API) showing same health with refresh key + quit key.
- [ ] Step 4: Typecheck, commit.

### Task 6: Verification

- [ ] `bun install` clean.
- [ ] `bun run typecheck` passes.
- [ ] `bun run lint` passes.
- [ ] `bun test` passes.
- [ ] `bun run build` production build passes.
- [ ] Start dev server with real local DB + placeholder Pocket ID envs; `curl -i /` redirects to /login (unauth); `/` protected.
- [ ] `WORKER_TOKEN=... bun cli status` returns health OK against dev server.
- [ ] OIDC browser login itself: NOT testable without a live Pocket ID instance — report honestly.

### Task 7: README + final commit

- [ ] README: layout, Pocket ID setup (create OIDC client, callback URL `/api/auth/oauth2/callback/pocket-id`), env vars table, run commands, migrations, verification.
- [ ] `.env.example` complete. Final commit.
