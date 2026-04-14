# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.3.3] - 2026-04-14

### Security

- Fixed rate-limit bypass via forged `X-Forwarded-For` header when `TRUST_PROXY=true`: proxy now uses the last (proxy-appended) segment instead of the first (client-controlled, forgeable) segment. Extracted as `extractTrustedIp()` with 7 regression tests.
- Moved Gemini API key from URL query parameter (`?key=...`) to `x-goog-api-key` request header, preventing key exposure in server access logs and CDN caches.
- Guarded `RATE_LIMIT` env var against `NaN`: invalid strings now fall back to the default of 20 rather than silently disabling the rate limiter.
- Added `Retry-After: 60` header on 429 responses so clients know when to retry.

## [1.3.2] - 2026-04-12

### Added

- You can now deploy Quick Flow Exporter to Vercel with zero config — `vercel.json` sets up the build command, output directory, and SPA rewrites so every route resolves correctly

## [1.3.1] - 2026-04-07

### Added

- Component tests for DiffPhase, ExportPhase, PastePhase, and ThemeContext (159 tests total)
- ThemeContext test suite covering localStorage persistence, system preference detection, toggle cycle, and error boundary

### Changed

- All cyan/teal accent colors replaced with blue (#2563EB / `blue-600`) across every component for red-green colorblind accessibility
- Red-only and green-only status signals in DiffPhase replaced with amber (removed) and blue (added) so states are distinguishable without color
- "NO CHANGES" state and success badges now include shape indicators (✓ checkmark) paired with color
- Nav buttons, Compare Flows button, bookmarklet link, and CTA buttons updated from cyan to blue
- Dot-grid background updated from cyan-500 to blue-600
- Icon buttons in StepCard and GroupCard enlarged to 36×36px minimum touch target (WCAG 2.5.5)
- FlowGraph close button gains `aria-label` for screen reader access
- Back and New Diff links gain `focus-visible:ring` keyboard focus indicators
- Error banners gain ⚠ icon prefix for non-color error signal

## [1.3.0] - 2026-03-30

### Added

- Light mode with theme toggle in the header (cycles light / dark / system)
- ThemeProvider context (`src/context/ThemeContext.tsx`) with localStorage persistence and `prefers-color-scheme` detection
- Inline theme initialization script in `index.html` to prevent flash of wrong theme on page load
- Chrome/Edge browser extension (Manifest V3) for one-click flow extraction
  - Popup UI with Extract, Copy to Clipboard, and Open in Exporter actions
  - Background service worker for opening the exporter app with extracted data
  - Generated PNG icons (16/48/128 px) with cyan lightning bolt
- `npm run build:extension` script using esbuild to bundle extension to `extension/dist/`
- `scripts/generate-icons.mjs` for programmatic extension icon generation

### Changed

- Tailwind config now uses `darkMode: 'class'` strategy
- All 12 component files updated with `dark:` variant classes alongside new light-mode base classes
- FlowGraph step type colors now have separate light and dark palettes
- Body gradient and dot-grid pattern in `index.css` are now theme-aware via `html.dark` selector

## [1.2.0] - 2026-03-30

### Added

- Multi-provider support: OpenAI, Google Gemini, and Perplexity alongside existing Anthropic and AWS Bedrock
- Provider selector in the UI — switch providers without restarting the proxy
- Per-request provider override — a single proxy instance can serve all providers simultaneously
- OpenAI-compatible shared caller (used by both OpenAI and Perplexity providers)
- Google Gemini provider via the Generative Language API
- Configurable models per provider via environment variables (OPENAI_MODEL, GEMINI_MODEL, PERPLEXITY_MODEL)
- Provider preference persisted in localStorage
- Full environment variable reference table in README
- Health endpoint now returns available providers list

### Changed

- Provider selection is now dynamic per-request (was fixed at server startup)
- Health endpoint returns `defaultProvider` and `providers` array (was `provider` string)
- API key prompt in UI now shows provider-specific placeholder text
- "Change key" link replaced with "Settings" link that opens full provider configuration

## [1.1.1] - 2026-03-29

### Added

- Pre-commit hooks with husky and lint-staged (eslint --fix + prettier --write on staged files)
- Explicit `prettier --check` and `tsc --noEmit` CI steps in GitHub Actions workflow
- `format:check` and `typecheck` npm scripts
- `.git-blame-ignore-revs` to skip formatting commit in git blame
- Prettier as an explicit devDependency (was previously npx-only)

### Changed

- Prettier config: `singleQuote: true`, `trailingComma: "es5"` (aligned to project standard)
- All source files auto-formatted with updated prettier config

## [1.1.0] - 2026-03-28

### Changed

- Rebranded from QuickSuite/QS to Quick Flow across all user-facing text
- Rewrote diff engine with keyed matching for accurate duplicate-title handling
- Extracted proxy utilities into `server/proxy-utils.ts` for cleaner separation
- Simplified component code across all phases
- Removed emoji from all UI elements, replaced with text labels
- Left-aligned content layout (was centered-everything)

### Fixed

- Diff matching now correctly handles steps with identical titles
- Removed raw HTML injection (XSS surface) in diff output
- Hardened proxy server input validation and error handling
- Rate limiter now uses remoteAddress by default (TRUST_PROXY opt-in)
- Bookmarklet uses textContent instead of document.write (XSS fix)
- Fixed .env.example VITE\_ prefix that would leak API keys in build

### Added

- Input length validation on proxy request fields
- Consistent focus ring styles across paste and diff textareas

## [1.0.0] - 2026-03-27

### Added

- Initial release
- AI-powered parsing of raw Quick Flows editor content via local proxy
- Support for all 10 Quick Flows step types (Chat Agent, General Knowledge, Web Search, UI Agent, Create Image, Quick Suite Data, Dashboards & Topics, Application Actions, User Input Text, User Input Files)
- Reasoning Group instruction extraction (second-pass AI parse for group metadata)
- Visual flow review and editing — reorder steps, edit prompts, adjust settings inline
- Interactive React Flow graph (DAG) with color-coded nodes by step type, dashed `@reference` edges, and subgraphs for reasoning groups
- Flow diffing — side-by-side comparison of two raw flow versions with word-level inline diffs
- Markdown export with full prompt text, tables, and step summaries
- Mermaid export (`flowchart TD`) that renders in GitHub, Quip, and mermaid.live
- JSON export for version control and re-import
- Export history with localStorage persistence (last 20 exports)
- One-click bookmarklet for extracting flow content from the Quick Flows editor
- AI proxy server with Anthropic (claude-sonnet) and AWS Bedrock support
- Rate limiting (20 req/60s per IP), input validation, CORS, and XSS hardening
