#!/usr/bin/env bash
# Dev-machine setup for personal-template (Ubuntu or macOS). Assumes bun, just,
# gh, and docker are already installed — checks for each and stops if any is
# missing. Then installs deps, starts local Postgres, and turns on branch
# protection so CI must pass before a PR to main can merge.
#
#   ./bootstrap.sh
set -euo pipefail

missing=0
for tool in bun just gh docker; do
  if command -v "$tool" >/dev/null 2>&1; then
    echo "ok       $tool"
  else
    echo "MISSING  $tool — install it, then re-run" >&2
    missing=1
  fi
done
[ "$missing" -eq 0 ] || exit 1

# --- project deps ------------------------------------------------------
echo "Installing workspace dependencies…"
bun install

# --- local Postgres --------------------------------------------------
docker compose up -d --wait db \
  || echo "NOTE: db not started (port 5432 busy, or Docker not running). Stop any local Postgres, then 'just db-up'."

# --- branch protection: CI must pass before merge -------------------
gh auth status >/dev/null 2>&1 || gh auth login
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Requiring CI checks on main for $REPO…"
gh api -X PUT "repos/$REPO/branches/main/protection" \
  -H "Accept: application/vnd.github+json" --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["check", "build-cli"] },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
echo "Done — PRs to main now blocked until 'check' and 'build-cli' pass."

echo
echo "Next: cp .env.example .env  →  just migrate  →  just dev"
