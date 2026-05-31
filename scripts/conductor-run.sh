#!/usr/bin/env zsh
# conductor-run.sh — Conductor Run-button entrypoint for quick-flow-exporter.
# Starts BOTH the AI proxy (server/proxy.ts) and the Vite dev server, with
# ports derived from $CONDUCTOR_PORT so parallel workspaces never collide.
set -euo pipefail

# Vite (the UI you open) takes the workspace's primary port; the proxy takes +1.
export VITE_PORT="${CONDUCTOR_PORT:-5173}"
if [[ -n "${CONDUCTOR_PORT:-}" ]]; then
  export PROXY_PORT="$((CONDUCTOR_PORT + 1))"
else
  export PROXY_PORT="3001"
fi
# server/proxy.ts reads process.env.PORT; vite.config.ts reads PROXY_PORT/VITE_PORT.
export PORT="$PROXY_PORT"

echo "[run] proxy → http://localhost:${PROXY_PORT}"
echo "[run] vite  → http://localhost:${VITE_PORT}"

# Proxy in the background; Vite in the foreground. Trap tears the proxy down
# when Conductor sends SIGHUP/SIGTERM so no orphan process survives the stop.
npx tsx server/proxy.ts &
PROXY_PID=$!
cleanup() { kill "$PROXY_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM HUP

npm run dev
