# Contributing

Thanks for your interest in contributing to Quick Flow Exporter.

## Getting Started

Prerequisites:

- Node.js 22 or newer
- npm 10 or newer

1. Fork the repo
2. Clone your fork and install dependencies:
   ```bash
   npm ci
   ```
3. Create a branch for your change:
   ```bash
   git checkout -b my-feature
   ```
4. Make your changes
5. Run the tests:
   ```bash
   npm run test           # single pass
   npm run test:watch     # re-runs on file changes (use during development)
   ```
6. Run the linter:
   ```bash
   npm run lint
   ```
7. Check formatting:
   ```bash
   npm run format:check
   ```
8. Type-check:
   ```bash
   npm run typecheck
   ```
9. Open a pull request

> **Note:** Pre-commit hooks (husky + lint-staged) run automatically on
> `git commit`. They apply `eslint --fix` and `prettier --write` to staged
> files, so most formatting issues are caught before you push.

## Guidelines

- Keep PRs focused — one feature or fix per PR
- Follow the existing code style (Prettier + ESLint handle most of it)
- Add types for any new data structures
- Update the README if you add new features or change setup steps
- Add tests for any new library functions (`src/lib/`) or components — the test files live alongside the source in `__tests__/` subdirectories

## Adding a New AI Provider

The AI integration lives in `server/proxy.ts` (HTTP server and routing), `server/proxy-utils.ts` (shared utilities), and `src/lib/ai.ts` (frontend client). To add a new provider:

1. Add a `callYourProvider(req: ProxyRequest)` function in `server/proxy.ts`
2. Wire it into the provider switch in the request handler
3. Add the provider to the `PROVIDERS` array in `src/lib/ai.ts` (label, key placeholder)
4. Add the provider type to the `Provider` union in `src/lib/ai.ts`
5. Document the required env vars in the README

## Working on the Browser Extension

The extension source lives in `extension/` and is bundled with esbuild:

```bash
npm run build:extension     # builds to extension/dist/
```

To test locally, load the `extension/dist/` directory as an unpacked extension in `chrome://extensions`. The popup inlines its extraction logic (no separate content script), and the background service worker handles opening the exporter app.

If you change the popup or background TypeScript, rebuild with the command above and reload the extension in the browser.

## Adding a New Step Type

Step types flow through several layers. Add them in this order:

1. Add the new type to the `StepType` union in `src/types.ts`
2. Add a display label and icon to `src/constants.ts` (`STEP_TYPE_LABELS`, `STEP_TYPE_ICONS`)
3. If the step has unique fields, add a rendering case in `src/components/StepFields.tsx`
4. Add a case in `src/lib/markdown.ts` (`generateMarkdown`) to document the step-specific fields
5. Add an emoji/icon mapping in `src/lib/mermaid.ts` (`stepIcon`) for the Mermaid flowchart
6. Update the LLM prompt in `src/lib/prompts.ts` to recognize and extract the new step type
7. Add tests in `src/lib/__tests__/markdown.test.ts` and `src/lib/__tests__/mermaid.test.ts`

## Adding a New Export Format

Exports are generated in `src/lib/` and surfaced in `src/components/ExportPhase.tsx`:

1. Create a new generator in `src/lib/` (e.g. `src/lib/html.ts`) that takes a `Flow` and returns a string
2. Add a button and copy/download handler in `ExportPhase.tsx`
3. Add a test file in `src/lib/__tests__/` covering the output format for representative flows

## Working with Themes

The app supports light, dark, and system themes via `src/context/ThemeContext.tsx`. When adding or modifying components:

- Use Tailwind's `dark:` variant for all color classes (e.g. `bg-white dark:bg-midnight-800`)
- For inline styles (like FlowGraph node colors), use the `useTheme()` hook to get `resolved` (`'light'` or `'dark'`) and select the appropriate palette
- Test both themes visually — the toggle is in the top-right header

## Reporting Issues

Open an issue with:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser/OS info if relevant

<!-- BEGIN: commit-message-standards (managed by bootstrap-repo.sh — do not hand-edit) -->

## Commit messages

This repo follows the [engineering-standards commit-message spec](https://github.com/florianhorner/engineering-standards/blob/main/specs/commit-message-spec.md). The cheat sheet below is self-sufficient — you do not need to leave the repo to write a conformant commit.

### 30-second cheat sheet

1. **Format:** `type(scope): subject` — e.g. `fix(auth): handle expired session cookie`
2. **Allowed types:** `feat fix docs style refactor test chore ci build perf revert`
3. **Subject:** ≤72 chars total, imperative mood ("fix bug" not "fixed bug"), no trailing period, no `v1.2.3` prefix
4. **Body required only when:** type is `feat` AND >50 lines changed. Body must include a `Why: <one-line>` (rule_id `WHY_REQUIRED`)
5. **Bypass:** `--no-verify` is allowed only with a `Policy-Override: <reason>` trailer (otherwise CI blocks)

### Good examples

```
fix(auth): handle expired session cookie returning undefined
```

```
docs(readme): clarify install prerequisites
```

```
feat(curve-card): add brightness scrubber with bar gauges

Why: ops team needs at-a-glance brightness state without opening editor.
Tested: e2e curve-editor + unit tests for scrubber state.
Refs: closes #67
```

### Bad examples (with the rule_id they violate)

```
Add files via upload                                 # rule_id: WEB_UI_DEFAULT
v2.10.11 feat(jamendo): country + order filters     # rule_id: VERSION_IN_SUBJECT
chore: addressed all the review comments             # rule_id: AGENT_SELF_TALK
```

```
feat(auth): add OAuth flow

florian asked me to add this                         # rule_id: OPERATOR_ATTRIBUTION (body)
```

### Body-when-required rule

A `Why:` body line is REQUIRED when **both** conditions hold:

- type is `feat`
- `git diff --shortstat` shows >50 lines changed

For all other commits the body is optional. Acceptable terse `Why:` templates:

- `Why: closes #N` (when issue body has the context)
- `Why: incident response — outage 2026-05-08T03:00Z`
- `Why: spec at <url>; see decision log section 3`

### Banned patterns — body only

| rule_id                | Disallowed                                                       | Fix                                                              |
| ---------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| `OPERATOR_ATTRIBUTION` | `florian asked`, `as requested`, `per request`, `per my request` | Replace with WHY: "fix X because Y"                              |
| `AGENT_SELF_TALK`      | `addressed all`, `fix all`, `fixed all`, `cleaned up everything` | Name specific changes: "fix N+1 in Foo.query, dedupe Bar.helper" |

### Banned patterns — subject only

| rule_id              | Disallowed                                                | Fix                                                            |
| -------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `WEB_UI_DEFAULT`     | `Add files via upload`, `Update Foo.md`, `Initial commit` | Use `type(scope): subject`; describe what changed              |
| `VERSION_IN_SUBJECT` | Subject starting with `v[0-9]`                            | Drop the version prefix; use `chore(release): 1.2.3` if needed |

### Exempt subjects (skip the format check entirely)

- Subjects starting with `Merge ` (git merge commits)
- Subjects starting with `Revert ` (`git revert`-generated)
- Subjects starting with `cherry-pick: ` (labeled cherry-picks)
- Subjects starting with `[hotfix] ` (emergency hotfix override)

### Bot allowlist

Commits authored by these identities skip the `WHY_REQUIRED` rule (subject banned-patterns still apply):

- `renovate[bot]`
- `dependabot[bot]` (this repo's `.github/dependabot.yml` sets `commit-message.prefix: "chore"` so the format check passes)
- `pre-commit-ci[bot]`
- `app/github-actions`

### Bypass policy

`git commit --no-verify` skips the local commit-msg hook. CI still validates on push. To pass CI on a sanctioned bypass:

1. Subject matches an exempt prefix (`Merge `, `Revert `, `cherry-pick: `, `[hotfix] `), OR
2. Body includes a `Policy-Override: <reason>` trailer

Example sanctioned bypass:

```bash
git commit --no-verify -m "[hotfix] fix prod outage from migration 0042" \
  -m "" \
  -m "Policy-Override: prod outage; migrating roll-forward fix; full review tomorrow"
```

The pre-push hook logs every `--no-verify` to `~/.commit-bypass.log` with the override reason.

### Where the rules live

- **Canonical spec:** https://github.com/florianhorner/engineering-standards/blob/main/specs/commit-message-spec.md
- **Vendored copy in this repo:** [`.config/commit-rules.json`](.config/commit-rules.json) — SHA-pinned snapshot consumed by the local hook, the commitlint config, and CI. Do not hand-edit.
<!-- END: commit-message-standards -->
