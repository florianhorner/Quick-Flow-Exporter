# TODOS

Deferred work captured during design and review sessions. Pick up when relevant.

## DX Review follow-ups (2026-04-17)

### ~~P2: Add Troubleshooting section or doc~~ — DONE (2026-06-20)

Shipped as a 6-row Troubleshooting table in `README.md` (proxy/greyed-out, 429 rate
limit, 401 auth, 500 KB cap, CORS, extension capture). Kept in-README rather than a
separate doc, per the "short section unless it grows" call. `/autoplan` 2026-06-20.

### P2: Community/Contributing hooks for OSS adoption

**What:** Strengthen the Contributing section beyond the current 3-step inline guide.

**Why:** DX Pass 7 (community) scored 4/10. For an OSS pitch the README has no:

- GitHub Discussions link ("Questions? Open a discussion")
- "Good first issue" pointer
- Issues-count badge in the badge row
- Issue templates (`.github/ISSUE_TEMPLATE/`)

**Why deferred:** Florian's judgment call — "this is a niche tool, not a rally point." Revisit if the repo starts getting inbound contributions or stars. (Issue templates now exist; the rest stays deferred.)

**Source:** `/plan-devex-review` 2026-04-17, Fix #4 deferred.

## Autoplan DX batch (2026-06-20)

`/autoplan` (CEO dual-voice: Codex gpt-5.5 + Claude) reviewed a 14-fix DX-polish plan.
Shipped 5, deferred 3, cut 6. Recorded here so cut items aren't re-proposed.

**Shipped:** README Troubleshooting table; `LICENSE` brand fix; PR-template ↔ CI parity
(`npm run typecheck` + `format:check`); `build:extension` added to CI; bug-template
"Quick Flows editor version" field.

**Deferred (not now, revisit on trigger):**

- **P3: pre-commit typecheck/test gate.** `.husky/pre-commit` runs only lint-staged. CI
  already catches type/test breaks; for a solo maintainer a heavier hook is friction.
  Revisit if inbound PRs start hitting CI-only failures.
- **P3: document `PROXY_PORT`** in `docs/AI_PROXY_SETUP.md` — only if someone actually
  hits the port-collision case.
- **P3: orchestration tests** for `src/App.tsx` / `src/lib/prompts.ts` — only around
  real bug-prone flows, not prompt unit tests (both reviewers: likely fake confidence).

**Cut (considered, not worth it for this tool — do not re-propose without new evidence):**
`CODE_OF_CONDUCT.md` (community work already deferred); type-aware ESLint (config churn,
no known bug class); bundle splitting (premature at 143 kB gzip); CHANGELOG 1.3.2/1.3.3
dedup (archival neatness); `.node-version` + act()-warning suppression (marginal).
`SECURITY.md`: only worth a one-line disclosure contact, not a policy doc.

**Higher-leverage move both reviewers pushed (P1 candidate, separate effort):** a
product-reliability moat, since the existential risk is the parser breaking when Amazon
changes the Quick Flows format —

- Golden fixtures from real/redacted Quick Flows
- Regression tests proving parse / graph / export / diff / extension capture still work
- A one-command local path (`npx quick-flow-exporter`) — partially shipped via `npm start` in #44
- An explicit "works with Quick Flows editor as of DATE" support posture

**Source:** `/autoplan` 2026-06-20.
