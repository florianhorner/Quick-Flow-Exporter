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
