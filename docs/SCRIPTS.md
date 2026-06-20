# Scripts & Tech Stack

[&larr; Back to README](../README.md)

## Tech Stack

- **React 19** + TypeScript
- **Tailwind CSS** for styling
- **React Flow** for the interactive graph visualization
- **diff-match-patch** for word-level text diffing
- **Vite** for dev/build tooling

## npm scripts

| Command                   | Description                                                     |
| ------------------------- | --------------------------------------------------------------- |
| `npm start`               | Start the frontend and local AI proxy together                  |
| `npm run dev`             | Start Vite frontend at localhost:5173                           |
| `npm run dev:all`         | Start Vite and `server/proxy.ts` with `concurrently`            |
| `npm run build`           | Type-check and build for production                             |
| `npm run build:extension` | Bundle browser extension to `extension/dist`                    |
| `npm run preview`         | Preview production build                                        |
| `npm run lint`            | Run ESLint                                                      |
| `npm run test`            | Run Vitest test suite once                                      |
| `npm run test:watch`      | Run Vitest in watch mode (re-runs on file changes)              |
| `npm run test:coverage`   | Run Vitest with coverage report                                 |
| `npm run format:check`    | Check formatting with Prettier                                  |
| `npm run typecheck`       | Type-check client and server (`tsc --noEmit` + server tsconfig) |

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
