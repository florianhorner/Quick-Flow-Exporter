# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
- AI-powered parsing of raw Quick Flows editor content
- Support for all Quick Flows step types
- Reasoning Group instruction extraction
- Visual flow review and editing
- Markdown export (copy to clipboard and file download)
- Export history with localStorage persistence
- AI proxy server with Anthropic and AWS Bedrock support
