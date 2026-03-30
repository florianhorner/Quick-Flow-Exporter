# Contributing

Thanks for your interest in contributing to Quick Flow Exporter.

## Getting Started

1. Fork the repo
2. Clone your fork and install dependencies:
   ```bash
   npm install
   ```
3. Create a branch for your change:
   ```bash
   git checkout -b my-feature
   ```
4. Make your changes
5. Run the tests:
   ```bash
   npm run test
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
