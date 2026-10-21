#!/usr/bin/env zsh
# conductor-setup.sh — workspace bootstrap for quick-flow-exporter
# Runs once per new Conductor workspace, inside the workspace directory.
# See: https://docs.conductor.build/core/scripts

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;34m'   # Blue status indicator
YELLOW='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'

info()  { echo "${BOLD}[setup]${RESET} $*"; }
ok()    { echo "${GREEN}[setup] ✓${RESET} $*"; }
warn()  { echo "${YELLOW}[setup] ⚠${RESET} $*"; }
die()   { echo "${RED}[setup] ✗${RESET} $*" >&2; exit 1; }

# ─── 1. Node version ───────────────────────────────────────────────────────────
info "Checking Node.js version..."

REQUIRED_NODE=$(cat .nvmrc)
if ! command -v node &>/dev/null || ! node scripts/check-node-version.mjs; then
  warn "A supported Node version is required. Trying nvm..."
  if [[ -f "$HOME/.nvm/nvm.sh" ]]; then
    source "$HOME/.nvm/nvm.sh"
    nvm install "$REQUIRED_NODE" || die "nvm install failed"
    nvm use "$REQUIRED_NODE"
  elif command -v brew &>/dev/null; then
    brew install node@22 || die "brew install node failed"
    export PATH="$(brew --prefix node@22)/bin:$PATH"
  else
    die "Install Node $REQUIRED_NODE or another version supported by package.json"
  fi
fi
node scripts/check-node-version.mjs || die "Unsupported Node version after setup"
ok "Node $(node --version)"

# ─── 2. npm version ────────────────────────────────────────────────────────────
REQUIRED_NPM=10
CURRENT_NPM=$(npm --version 2>/dev/null | cut -d. -f1 || echo 0)
if (( CURRENT_NPM < REQUIRED_NPM )); then
  warn "npm $CURRENT_NPM found — upgrading to latest..."
  npm install -g npm@latest
fi
ok "npm $(npm --version)"

# ─── 3. Dependencies ───────────────────────────────────────────────────────────
info "Installing npm dependencies..."
npm install --prefer-offline || die "npm install failed"
ok "npm install done"

# ─── 4. .env file ──────────────────────────────────────────────────────────────
info "Setting up .env..."

if [[ -f ".env" ]]; then
  ok ".env already exists — skipping"
elif [[ -n "${CONDUCTOR_ROOT_PATH:-}" && -f "$CONDUCTOR_ROOT_PATH/.env" ]]; then
  # Symlink shared .env from the repo root (recommended Conductor pattern)
  ln -s "$CONDUCTOR_ROOT_PATH/.env" .env
  ok "Symlinked .env from \$CONDUCTOR_ROOT_PATH"
elif [[ -f ".env.example" ]]; then
  cp .env.example .env
  warn ".env copied from .env.example — you must set ANTHROPIC_API_KEY before the proxy server works"
  warn "Edit .env and add:  ANTHROPIC_API_KEY=sk-ant-..."
fi

# ─── 5. Husky git hooks ────────────────────────────────────────────────────────
info "Installing git hooks (husky)..."
npm run prepare 2>&1 | tail -3 || warn "husky prepare failed — hooks won't run pre-commit"
ok "Husky hooks ready"

# ─── 6. Quick health check ─────────────────────────────────────────────────────
info "Running quick type-check..."
npm run typecheck 2>&1 | tail -10 && ok "TypeScript clean" || warn "Type errors detected — run: npm run typecheck"

echo ""
echo "${BOLD}── Workspace ready ──────────────────────────────────────────${RESET}"
echo "  Dev server:  npm run dev         (Conductor Run starts proxy+vite on \$CONDUCTOR_PORT)"
echo "  Tests:       npm run test"
echo "  Lint:        npm run lint"
echo "  Build:       npm run build"
echo "  Extension:   npm run build:extension"
echo ""

if ! grep -qE "^[A-Z_]+_API_KEY=.+" .env 2>/dev/null; then
  echo "${YELLOW}${BOLD}  ACTION REQUIRED:${RESET} Set at least one API key in .env"
  echo "  The proxy server (server/proxy.ts) needs an API key for at least one provider."
  echo ""
fi
