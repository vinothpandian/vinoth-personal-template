#!/usr/bin/env bash
# Install the personal-template CLI on Linux.
#
#   gh api repos/vinothpandian/vinoth-personal-template/contents/install.sh \
#     -H "Accept: application/vnd.github.raw" | bash
#
# Requires `gh auth login` (repo is private — curl/raw URLs 404).
# Downloads the latest release binary, then stores API_URL + WORKER_TOKEN as
# exports in your shell env file. Set those as env vars beforehand to skip the
# prompts (useful for non-interactive installs).
set -euo pipefail

# The released binary is linux x86_64 only (see .github/workflows/ci.yml).
if [ "$(uname -s)" != "Linux" ] || [ "$(uname -m)" != "x86_64" ]; then
  echo "This installer is for linux x86_64. On macOS, build locally: 'just build-cli'." >&2
  exit 1
fi

REPO="vinothpandian/vinoth-personal-template"

command -v gh >/dev/null || { echo "Install gh: https://cli.github.com" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Run: gh auth login" >&2; exit 1; }

# --- download -------------------------------------------------------------
BIN_DIR="/usr/local/bin"
[ -w "$BIN_DIR" ] || BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

echo "Downloading pt-cli -> $BIN_DIR/pt-cli"
gh release download --repo "$REPO" --pattern pt-cli --dir "$BIN_DIR"
chmod +x "$BIN_DIR/pt-cli"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) echo "NOTE: $BIN_DIR is not on your PATH - add it." ;;
esac

# --- env vars ----------------------------------------------------------------
case "${SHELL:-}" in
  */zsh) RC="$HOME/.zshenv" ;;
  *)     RC="$HOME/.bashrc" ;;
esac
touch "$RC"

ask() { # ask VAR "prompt" [-s]
  local prompt=$2 val="${!1:-}"
  if [ -z "$val" ]; then
    read -r ${3:-} -p "$prompt: " val < /dev/tty
    [ "${3:-}" = "-s" ] && echo >&2
  fi
  printf '%s' "$val"
}

set_export() { # set_export KEY VALUE
  local key=$1 val=$2
  if grep -q "^export $key=" "$RC"; then
    echo "$key already set in $RC - leaving it. Edit $RC to change."
  else
    printf "export %s='%s'\n" "$key" "$val" >> "$RC"
    echo "Added $key to $RC"
  fi
}

API_URL=$(ask API_URL "API_URL (base URL of the web app)")
WORKER_TOKEN=$(ask WORKER_TOKEN "WORKER_TOKEN (static bearer token)" -s)

set_export API_URL "$API_URL"
set_export WORKER_TOKEN "$WORKER_TOKEN"

echo
echo "Done. Reload your shell (or 'source $RC'), then: pt-cli status"
