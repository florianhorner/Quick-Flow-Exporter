# TODOS

Deferred work captured during design and review sessions. Pick up when relevant.

## Demo mode + AI proxy review follow-ups (2026-06-20)

### P2: `dev:all` ignores an ambient shell `PORT`

**What:** `npm start` → `dev:all` runs the proxy as `tsx server/proxy.ts`. `getProxyPort()` reads `PORT` first, so a developer with `export PORT=8080` in their shell makes the proxy bind to 8080 while Vite's `/api` target stays at `PROXY_PORT ?? 3001`. Every `/api/parse` 404s silently.

**Fix options:** strip the ambient var in the script (`env -u PORT tsx server/proxy.ts`), pin `PROXY_PORT=3001` for the child, or document the gotcha.

**Source:** pre-ship adversarial review, 2026-06-20 (P1, deferred — needs ambient `PORT`, not the default path).

### P2: extension build bakes `localhost:5173` when `EXPORTER_BASE_URL` is unset

**What:** `scripts/build-extension.mjs` defaults `__EXPORTER_BASE_URL__` to `http://localhost:5173`. A packaged/distributed extension built without the env var set opens a dead localhost tab for end users.

**Fix:** warn loudly (or fail) in `build-extension.mjs` when `EXPORTER_BASE_URL` is unset and the build isn't a dev build.

**Source:** pre-ship adversarial review, 2026-06-20 (documented in `docs/BROWSER_EXTENSION.md`, so deferred).

### P2: `docs/AI_PROXY_SETUP.md` still shows the old two-terminal proxy flow

**What:** Per-provider examples show bare `npx tsx server/proxy.ts` (UI not started), and the env-var table describes `PORT`/`PROXY_PORT` backwards (`PROXY_PORT` is consumed by Vite, not a proxy-server fallback).

**Fix:** frame the provider examples as proxy-only overrides to `npm start`, and correct the env-var table descriptions.

**Source:** pre-ship docs/config review, 2026-06-20.

## DX Review follow-ups (2026-04-17)

### P2: Add Troubleshooting section or doc

**What:** Common error coverage beyond the single "Parse & Extract greyed out" note currently in the README.

**Why:** DX Pass 3 (error messages) scored 6/10 — only one error path is documented. Developers hitting rate limits, invalid API keys, the 500KB paste limit, CORS/proxy errors, or extension install issues have no reference.

**Scope options:**

- Short section in README (4-5 common cases) → fastest, visible
- Full `docs/TROUBLESHOOTING.md` → thorough, one more click
- Both

**Source:** `/plan-devex-review` 2026-04-17, Fix #4 deferred.

### P2: Community/Contributing hooks for OSS adoption

**What:** Strengthen the Contributing section beyond the current 3-step inline guide.

**Why:** DX Pass 7 (community) scored 4/10. For an OSS pitch the README has no:

- GitHub Discussions link ("Questions? Open a discussion")
- "Good first issue" pointer
- Issues-count badge in the badge row
- Issue templates (`.github/ISSUE_TEMPLATE/`)

**Why deferred:** Florian's judgment call — "this is a niche tool, not a rally point." Revisit if the repo starts getting inbound contributions or stars.

**Source:** `/plan-devex-review` 2026-04-17, Fix #4 deferred.
