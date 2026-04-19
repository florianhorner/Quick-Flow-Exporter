# Security Fix Plan — quick-flow-exporter

Branch: florianhorner/vercel-exposure-audit
Created: 2026-04-19
Source: Full codebase security review (not a diff review)

## Problem

A full security assessment of the codebase revealed 9 actionable findings across the static SPA and the optional local proxy server. Findings span CSP misconfiguration, header injection, missing auth, unbounded data structures, and a deliberate React security bypass. These need to be remediated before the next release.

## Premises

1. The Vercel deployment is a static SPA — no backend. The proxy (`server/proxy.ts`) runs locally.
2. The proxy is currently documented as local-only but could be deployed remotely by operators.
3. The browser extension reads full page text from any active tab.
4. Users store AI API keys in sessionStorage and send them to the local proxy in headers.

## What Already Exists

- CSP headers in `vercel.json` (need amendment)
- Rate limiter in `server/proxy-utils.ts` (needs cap)
- Health endpoint in `server/proxy.ts` (needs pruning)
- Bookmarklet panel in `src/components/BookmarkletPanel.tsx` (needs refactor)
- Extension background script in `extension/background/background.ts` (needs dead code removal)
- Inline theme script in `index.html` (needs extraction)

## Fixes in Scope (Priority Order)

### P1 — HIGH: Extract inline theme script (index.html → public/theme-init.js)

**File:** `index.html:7-16`, `vercel.json:11`

The inline `<script>` block reading `localStorage` for dark mode is blocked by `script-src 'self'` CSP (no `unsafe-inline`, no nonce). Every user gets a flash of wrong theme. The real risk: future devs will add `unsafe-inline` to fix the bug, opening XSS.

**Fix:** Extract the IIFE to `public/theme-init.js`. Replace inline script with `<script src="/theme-init.js"></script>`.

**Files:** `index.html`, `public/theme-init.js` (new)

---

### P2 — HIGH: Sanitize clientKey before forwarding (server/proxy.ts:427)

`clientKey` is taken from the `x-api-key` request header and forwarded verbatim to upstream AI providers. A value with `\r\n` could inject upstream request headers.

**Fix:** Strip non-printable/non-ASCII characters. Enforce format and length: `^[A-Za-z0-9\-_.]+$`, max 200 chars. Reject with 400 if invalid.

**Files:** `server/proxy.ts`

---

### P3 — MEDIUM: Remove dead AI domains from CSP connect-src (vercel.json:11)

`connect-src` includes `api.anthropic.com`, `api.openai.com`, `api.perplexity.ai`, `generativelanguage.googleapis.com`. None are called directly from the browser — all traffic goes to `/api/parse`. These dead entries would silently permit future direct-to-AI calls that bypass the proxy.

**Fix:** Remove all AI provider domains from `connect-src`. Keep only `'self'`.

**Files:** `vercel.json`

---

### P4 — LOW: Add missing security headers (vercel.json)

Missing: `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`.

**Fix:** Add:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

**Files:** `vercel.json`

---

### P5 — MEDIUM: Remove dead `#flow=` hash feature from extension (extension/background/background.ts:7-14)

The extension encodes page text into a URL hash fragment (`#flow=<encoded>`) but the app never reads it. Dead code with future XSS potential if someone implements the read side without sanitization.

**Fix:** Remove the hash parameter from the tab URL. Keep the extension opening the exporter URL without the hash.

**Files:** `extension/background/background.ts`

---

### P6 — MEDIUM: Replace bookmarklet anchor with copy-only UI (src/components/BookmarkletPanel.tsx:50-52)

The bookmarklet panel uses a DOM ref to set `javascript:` href directly after render, explicitly bypassing React 19's XSS protection. The comment says "React 19 blocks javascript: URLs. Set href directly on the DOM to bypass."

**Fix:** Remove the draggable anchor element. The existing copy button is sufficient. Update surrounding UI to remove drag affordance.

**Files:** `src/components/BookmarkletPanel.tsx`

---

### P7 — MEDIUM: Prune /health endpoint response (server/proxy.ts:372-379)

`/health` returns `{ status, defaultProvider, providers[] }` without auth. Leaks AI vendor config to anyone probing the proxy.

**Fix:** Return only `{ "status": "ok" }`. Move provider info to a separate authenticated endpoint if needed.

**Files:** `server/proxy.ts`

---

### P8 — MEDIUM: Cap rate limiter map size (server/proxy-utils.ts:152-185)

In-memory `Map<IP, timestamps[]>` grows unbounded between 5-minute prune cycles.

**Fix:** Cap at 10,000 entries. On overflow, evict the oldest entry before inserting new.

**Files:** `server/proxy-utils.ts`

---

### P9 — MEDIUM: Warn on CORS wildcard at proxy startup (server/proxy.ts:360)

If `CORS_ORIGIN` is unset or `*`, operators silently allow any origin to use their proxy. No startup warning exists.

**Fix:** On startup, if `CORS_ORIGIN` is `*` or unset in non-development env, log a prominent warning: "WARNING: CORS_ORIGIN=\* allows any origin. Set CORS_ORIGIN to your app's domain."

**Files:** `server/proxy.ts`

---

## Not in Scope (Deferred)

- **Proxy authentication token (M1):** Adding `Authorization: Bearer` to the proxy is the right long-term fix but requires client-side changes and is only material if the proxy is deployed remotely. Deferred to TODOS.md.
- **Extension host_permissions scoping (L4):** Requires knowing the Quick Flows editor domain. Deferred.
- **sessionStorage UX warning improvement (L3):** Copy change, low impact. Deferred.
- **Export filename Unicode guard (L2):** Usability issue, not security. Deferred.

## Test Plan Sketch

- `index.html` renders with no CSP violations in browser console after extraction
- CSP header in `vercel.json` has no AI provider domains in `connect-src`
- `vercel.json` has HSTS, Referrer-Policy, Permissions-Policy headers
- `clientKey` with `\r\n` returns 400 from proxy
- `clientKey` with valid key format forwards successfully
- `/health` returns only `{ "status": "ok" }` — no provider fields
- Rate limiter map never exceeds 10,000 entries under test load
- Proxy logs warning if `CORS_ORIGIN=*` on startup
- Extension opens exporter URL without `#flow=` hash
- Bookmarklet panel has no draggable anchor — only copy button

## Effort Estimate

## ~3-4 hours human. ~30 min CC.

## Eng Review — Phase 3 Amendments

### Architecture ASCII Diagram

```
index.html ──────────────── public/theme-init.js  (P1: extract)
     │
     └── React SPA
          ├── BookmarkletPanel.tsx ──── remove anchor, keep copy btn  (P6)
          ├── ExportPhase.tsx          (no change)
          └── lib/ai.ts ──────────────── x-api-key header ──────────────┐
                                                                          │
vercel.json  (P3: CSP connect-src)                                       ▼
vercel.json  (P4: HSTS/Referrer/Permissions)                    server/proxy.ts
                                                                  │   line 427: clientKey ingress guard  (P2)
extension/background/background.ts                                │   line 360: CORS wildcard warning   (P9)
  └── remove #flow= hash + full listener  (P5)                   │   line 372: /health prune           (P7)
                                                                  │
                                                              proxy-utils.ts
                                                                  └── createRateLimiter: cap at MAX_TRACKED_IPS  (P8)
```

### Eng Implementation Notes (auto-decided)

| Fix | Amendment                                                                                                                                                       | Principle       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| P1  | Create `public/` dir before extracting script. Verify ThemeContext.tsx default ('dark') matches script logic.                                                   | P3 pragmatic    |
| P2  | Sanitization at `proxy.ts:427` — strip control chars + enforce length only. No format whitelist (Bedrock keys differ). Reject with 400 if `\r` or `\n` present. | P5 explicit     |
| P5  | Remove entire `onMessage` listener, not just the `if` block. File reduces to `export {};`.                                                                      | P1 completeness |
| P6  | Replace `BookmarkletPanel.tsx:73` copy: "Drag the button below" → "Click the button below to copy". Remove `ref`, `useRef`, `useEffect` for href bypass.        | P3 pragmatic    |
| P8  | Eviction strategy: refuse new bucket when at capacity (simpler, no LRU state). Add `MAX_TRACKED_IPS = 10_000` constant to `proxy-utils.ts`.                     | P5 explicit     |

### Test Gaps (new tests required)

- P2: clientKey `\r\n` → 400; valid key → forwarded; key >200 chars → 400
- P6: no `<a href="javascript:">` in BookmarkletPanel render; no "Drag" copy
- P7: GET /health returns exactly `{ "status": "ok" }` — regression guard
- P8: Map never exceeds MAX_TRACKED_IPS; cap triggers correctly

Test plan artifact: `~/.gstack/projects/florianhorner-Quick-Flow-Exporter/florianhorner-florianhorner-vercel-exposure-audit-eng-review-test-plan-20260419-214406.md`

---

## DX Review — Phase 3.5 Amendments

**DX Consensus Table:**

```
═══════════════════════════════════════════════════════════════════════
  Dimension                              Verdict
  ─────────────────────────────────────── ──────────────────────────
  1. Getting started < 5 min?             N/A (security fix, not feature)
  2. API/CLI naming guessable?            ✅ env vars consistent with existing
  3. Error messages actionable?           ❌ P2 and P9 need better messages
  4. Docs findable & complete?            ❌ P7 breaking change undocumented
  5. Upgrade path safe?                   ⚠️  P7 silently breaks health monitors
  6. Dev environment friction-free?       ✅ P1 no operator impact
═══════════════════════════════════════════════════════════════════════
```

**DX Auto-Decisions:**

| Fix | Amendment                                                                                                                                                                                                                                                    | Principle       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| P2  | Resolve plan contradiction: use **control-char strip only** (not format regex). Bedrock STS tokens contain `+`/`/` (base64). 400 error message: `"Invalid x-api-key: contains disallowed characters (\\r, \\n, or null bytes). See docs/AI_PROXY_SETUP.md."` | P5 explicit     |
| P7  | Add `## Breaking Changes` section to PLAN.md. Require CHANGELOG.md entry when shipped: "`/health` now returns only `{ status: 'ok' }` — `defaultProvider` and `providers` fields removed." Capture authenticated provider endpoint in TODOS.md.              | P1 completeness |
| P8  | Expose `MAX_TRACKED_IPS` as configurable env var (default 10,000). Add to AI_PROXY_SETUP.md env-var table. Log a `[proxy] WARNING: tracked IP count at capacity (MAX_TRACKED_IPS=N), new IPs refused` when limit is hit.                                     | P1 completeness |
| P9  | Expand startup warning: `"WARNING: CORS_ORIGIN is not set or is '*'. Any origin can use this proxy. Set CORS_ORIGIN=https://your-app.example.com"`. Add one-line note to AI_PROXY_SETUP.md CORS_ORIGIN row.                                                  | P5 explicit     |

## Breaking Changes

- **`/health` response (P7):** Fields `defaultProvider` and `providers` are removed. Response is now `{ "status": "ok" }` only. Operators scripting against these fields must update their scripts.

---

## CEO Review — Phase 1 Summary

**Dream State Delta:** After this plan, the SPA has a clean CSP (no dead domains, no inline scripts), the proxy sanitizes forwarded keys, and operators get startup warnings on wildcard CORS. The 12-month ideal adds proxy auth token and extension host scoping. This plan gets us 70% there.

**NOT in scope:** Proxy auth token (M1), extension host_permissions scoping, sessionStorage UX copy, export filename Unicode guard.

**What already exists:** CSP in `vercel.json`, rate limiter in `proxy-utils.ts`, health endpoint in `proxy.ts`, bookmarklet panel in `BookmarkletPanel.tsx`, extension background script.

**Error & Rescue Registry:**

| Fix                           | Risk of breakage                              | Recovery                 |
| ----------------------------- | --------------------------------------------- | ------------------------ |
| P1 theme extraction           | Low — Vite copies `public/` to `dist/`        | Revert to inline script  |
| P2 clientKey sanitization     | Low — only invalid keys rejected              | Widen regex if needed    |
| P3 CSP connect-src            | Medium — if any direct browser→AI calls exist | Add back specific domain |
| P6 bookmarklet anchor removal | Medium — drag-to-bookmark broken              | Restore anchor with note |

**Decision Audit Trail:**

| #   | Phase | Decision                                     | Classification | Principle             | Rationale                                                                                          | Rejected                          |
| --- | ----- | -------------------------------------------- | -------------- | --------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------- |
| 1   | CEO   | Keep proxy auth deferred                     | User Challenge | User override         | User explicitly rejected both models' recommendation to bring auth to P1. User's direction stands. | Bring auth to P1                  |
| 2   | CEO   | Proceed with current P1-P9 ordering          | Mechanical     | P6 bias toward action | User confirmed ordering. Ship the plan.                                                            | Reorder by risk                   |
| 3   | Eng   | P2: control-char strip only, no format regex | Mechanical     | P5 explicit           | Bedrock STS tokens use base64 (+/); strict regex breaks Bedrock silently.                          | Strict `^[A-Za-z0-9\-_.]+$` regex |
| 4   | Eng   | P5: remove entire onMessage listener         | Mechanical     | P1 completeness       | Listener with empty body is dead code.                                                             | Keep listener stub                |
| 5   | Eng   | P6: update UI copy "Drag" → "Click to copy"  | Mechanical     | P3 pragmatic          | Drag affordance gone; copy is the only remaining action.                                           | Keep "Drag" copy                  |
| 6   | Eng   | P8: refuse new bucket when at capacity       | Mechanical     | P5 explicit           | Simpler than LRU; no lastSeen state needed.                                                        | LRU eviction                      |
| 7   | DX    | P7: add Breaking Changes section + CHANGELOG | Mechanical     | P1 completeness       | Silent break for health monitors. Doc sync rule.                                                   | No migration note                 |
| 8   | DX    | P8: expose MAX_TRACKED_IPS as env var        | Mechanical     | P1 completeness       | RATE_LIMIT is already configurable; parity expected.                                               | Hardcode 10k                      |
| 9   | DX    | P9: expand warning with concrete example     | Mechanical     | P5 explicit           | "Set to your domain" is not actionable without an example.                                         | Terse warning only                |

<!-- /autoplan restore point: /Users/florianhorner/.gstack/projects/florianhorner-Quick-Flow-Exporter/florianhorner-vercel-exposure-audit-autoplan-restore-20260419-213310.md -->
