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
   npx vitest run
   ```
6. Run the linter:
   ```bash
   npm run lint
   ```
7. Type-check both frontend and server:
   ```bash
   npx tsc -p tsconfig.json --noEmit
   npx tsc -p tsconfig.server.json --noEmit
   ```
8. Open a pull request

## Guidelines

- Keep PRs focused — one feature or fix per PR
- Follow the existing code style (Prettier + ESLint handle most of it)
- Add types for any new data structures
- Update the README if you add new features or change setup steps

## Adding a New AI Provider

The AI integration lives in `server/proxy.ts` (HTTP server and routing) and `server/proxy-utils.ts` (shared utilities like rate limiting and request validation). To add a new provider:

1. Add a `callYourProvider(req: ProxyRequest)` function in `proxy.ts`
2. Wire it into the `PROVIDER` switch at the bottom
3. Document the required env vars in the README

## Reporting Issues

Open an issue with:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser/OS info if relevant
