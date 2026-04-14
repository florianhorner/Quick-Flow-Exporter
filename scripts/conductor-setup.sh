#!/usr/bin/env zsh
# conductor-setup.sh — workspace bootstrap for quick-flow-exporter
# Runs once per new Conductor workspace, inside the workspace directory.
# See: https://docs.conductor.build/core/scripts

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;34m'   # Using blue — Florian is red-green colorblind
YELLOW='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'

info()  { echo "${BOLD}[setup]${RESET} $*"; }
ok()    { echo "${GREEN}[setup] ✓${RESET} $*"; }
warn()  { echo "${YELLOW}[setup] ⚠${RESET} $*"; }
die()   { echo "${RED}[setup] ✗${RESET} $*" >&2; exit 1; }

# ─── 1. Node version ───────────────────────────────────────────────────────────
info "Checking Node.js version (need >= 22)..."

REQUIRED_NODE=22
CURRENT_NODE=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1 || echo 0)

if (( CURRENT_NODE < REQUIRED_NODE )); then
  warn "Node $CURRENT_NODE found — need $REQUIRED_NODE+. Trying nvm..."
  if [[ -f "$HOME/.nvm/nvm.sh" ]]; then
    source "$HOME/.nvm/nvm.sh"
    nvm install $REQUIRED_NODE --reinstall-packages-from=default || die "nvm install failed"
    nvm use $REQUIRED_NODE
    ok "Switched to Node $(node --version) via nvm"
  elif command -v brew &>/dev/null; then
    brew install node@$REQUIRED_NODE || die "brew install node failed"
    export PATH="$(brew --prefix node@$REQUIRED_NODE)/bin:$PATH"
    ok "Installed Node $(node --version) via Homebrew"
  else
    die "Node $REQUIRED_NODE+ required. Install via https://nodejs.org or brew install node@22"
  fi
else
  ok "Node $(node --version)"
fi

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
npm install --prefer-offline 2>&1 | tail -5
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

# ─── 7. Wishlist check ─────────────────────────────────────────────────────────
echo ""
echo "${BOLD}── Tool wishlist status ─────────────────────────────────────${RESET}"

check_tool() {
  local name=$1; local cmd=$2
  if command -v $cmd &>/dev/null; then
    ok "$name ($(command -v $cmd))"
  else
    warn "$name not found — install with: $3"
  fi
}

check_tool "gh (GitHub CLI)"   gh       "brew install gh"
check_tool "jq"                jq       "brew install jq"
check_tool "ripgrep (rg)"      rg       "brew install ripgrep"
check_tool "fd"                fd       "brew install fd"
check_tool "bat"               bat      "brew install bat"
check_tool "delta (git-delta)" delta    "brew install git-delta"

echo ""
echo "${BOLD}── Workspace ready ──────────────────────────────────────────${RESET}"
echo "  Dev server:  npm run dev         → http://localhost:5173"
echo "  Tests:       npm run test"
echo "  Lint:        npm run lint"
echo "  Build:       npm run build"
echo "  Extension:   npm run build:extension"
echo ""

if ! grep -q "ANTHROPIC_API_KEY=sk-ant-" .env 2>/dev/null; then
  echo "${YELLOW}${BOLD}  ACTION REQUIRED:${RESET} Set ANTHROPIC_API_KEY in .env"
  echo "  The proxy server (server/proxy.ts) won't start without it."
  echo ""
fi
