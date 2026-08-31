# Multi-stage build for Coolify (or any Docker host).
#   default target  → web app (runs migrations, then serves on :3000)
#   --target=cli    → scratch image holding the compiled Linux CLI binary
#     extract with: docker build --target=cli --output=dist/linux .

FROM oven/bun:1.3 AS builder
WORKDIR /app

# Install all workspace deps (source must be present first: bun's isolated
# installs link workspace packages by path).
COPY . .
RUN bun install --frozen-lockfile

# Production build of the web app (self-contained nitro output)
RUN cd apps/web && bun run build

# Standalone binaries: migration runner + CLI (native linux build)
RUN cd packages/db && bun build --compile src/migrate.ts --outfile /out/migrate
RUN cd apps/cli && bun build --compile src/index.ts --outfile /out/pt-cli

# --- CLI binary export target ----------------------------------------------
# Kept ahead of `web` on purpose: `web` must be the LAST stage so a bare
# `docker build` (Coolify) defaults to it. Extract the CLI with an explicit
# `--target=cli` (see `just build-cli-linux`).

FROM scratch AS cli
COPY --from=builder /out/pt-cli /pt-cli

# --- web app runtime (default target) -------------------------------------

FROM oven/bun:1.3-slim AS web
WORKDIR /app
ENV NODE_ENV=production
ENV MIGRATIONS_DIR=/app/migrations

COPY --from=builder /app/apps/web/.output ./.output
COPY --from=builder /app/packages/db/migrations ./migrations
COPY --from=builder /out/migrate ./migrate

EXPOSE 3000

# Readiness for Coolify: any HTTP reply on / (307 -> /login unauthenticated)
# means the server is up. bun is the only runtime in the slim image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"

# Apply pending migrations, then serve. PORT is respected by nitro.
CMD ["sh", "-c", "./migrate && exec bun .output/server/index.mjs"]
