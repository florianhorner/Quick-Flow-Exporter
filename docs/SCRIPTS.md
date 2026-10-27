# Scripts & Tech Stack

[&larr; Back to README](../README.md)

## Tech Stack

- **React 19** + TypeScript
- **Tailwind CSS** for styling
- **React Flow** for the interactive graph visualization
- **diff-match-patch** for word-level text diffing
- **Vite** for dev/build tooling

## npm scripts

| Command                      | Description                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `npm start`                  | Start the frontend and local AI proxy together                  |
| `npm run dev`                | Start Vite frontend at localhost:5173                           |
| `npm run dev:all`            | Start Vite and `server/proxy.ts` with `concurrently`            |
| `npm run build`              | Type-check and build for production                             |
| `npm run build:extension`    | Bundle browser extension to `extension/dist`                    |
| `npm run preview`            | Preview production build                                        |
| `npm run lint`               | Run ESLint                                                      |
| `npm run test`               | Run tooling, repository checks and Vitest once                  |
| `npm run test:tooling`       | Check runtime boundaries and release version updates            |
| `npm run check:version`      | Verify manifest and both lockfile versions match                |
| `npm run check:node`         | Verify the current Node release matches the supported range     |
| `npm run test:repository`    | Run repository content and commit-policy regression tests       |
| `npm run check:public-files` | Check for private working files before publication              |
| `npm run test:watch`         | Run Vitest in watch mode (re-runs on file changes)              |
| `npm run test:coverage`      | Run Vitest with coverage report                                 |
| `npm run format:check`       | Check formatting with Prettier                                  |
| `npm run typecheck`          | Type-check client and server (`tsc --noEmit` + server tsconfig) |

## Prerequisites

- Node.js `^22.22.2 || ^24.15.0 || >=26.0.0` (`nvm use` selects Node 22)
- npm 10 or newer

When runtime repair is needed, nvm installs the exact release in `.nvmrc`; Homebrew installs an available release from that major. Setup checks the resulting runtime before installing the committed lockfile with `npm ci`. npm also enforces the declared engine range through `.npmrc`.

Setup honors `NVM_DIR` when set and otherwise looks in `~/.nvm`. CI exercises both real nvm and Homebrew repair paths on macOS, starting from an unsupported Node release, then checks the selected runtime, unchanged dependency declarations, tests and builds.

## Conductor configuration checks

CI validates the shared TOML settings, tracked configuration, ignored local overrides and lifecycle script paths on Linux and Windows. To run these checks locally, use Python 3.11 or newer:

```bash
python scripts/check_conductor_settings.py
python -m unittest discover -s scripts -p test_conductor_settings.py
```
