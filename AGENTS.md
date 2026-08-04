# AGENTS.md

## Cursor Cloud specific instructions

Quick Flow Exporter is a single npm product (React 19 + Vite SPA) with a companion local
Node AI proxy and an optional Chrome/Edge extension. There is no database and no Docker.
Node 22+ / npm 10+ are required and already present on the cloud VM. Standard commands live
in `package.json` scripts and `README.md`; only the non-obvious caveats are captured here.

### Running the app

- `npm start` (alias for `npm run dev:all`) runs both processes concurrently: the Vite UI on
  `http://localhost:5173` and the AI proxy on `http://localhost:3001`. Vite proxies `/api/*`
  to the proxy. Proxy health check: `curl http://localhost:3001/health`.
- To run only one side: `npm run dev` (UI) or `npx tsx server/proxy.ts` (proxy).

### Testing without an AI provider key (important)

- Real "Parse & Extract" needs a provider API key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
  `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, or AWS creds for Bedrock). None are set by default,
  so parsing is expected to be unavailable until a key is added as a secret.
- You do NOT need a key to exercise the core pipeline end-to-end: click **Load example** on
  the Paste screen to load a bundled flow and jump straight to the Graph phase. From there the
  Graph, Export (Markdown/Mermaid/JSON), and Diff phases all run fully client-side. This is the
  reliable "hello world" path in the cloud environment.

### Quality gates

- Lint: `npm run lint` (one pre-existing `react-refresh` warning in `ThemeContext.tsx`; 0 errors).
- Types: `npm run typecheck` (checks both app and server tsconfigs).
- Tests: `npm run test` (Vitest, uses mocks — no running services needed).
- Build: `npm run build` (SPA) and `npm run build:extension` (esbuild → `extension/dist/`).

### Commits

- Commit messages must follow Conventional Commits (`type(scope): subject`, ≤72 chars); a
  `commit-msg` hook and CI validate them via `.config/commit-rules.json`. See `CONTRIBUTING.md`.
