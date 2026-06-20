# TODOS

Deferred work captured during design and review sessions. Pick up when relevant.

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
