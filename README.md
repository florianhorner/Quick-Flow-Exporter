# ⚡ Quick Flow Exporter

Extract, visualize, diff, and document your [Amazon Quick Flows](https://aws.amazon.com/quick/flows/) — because the tool doesn't come with a native way to do it.

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![React Flow](https://img.shields.io/badge/React_Flow-12-ff0072)

## Why This Exists

Amazon Quick Flows (formerly QuickSuite) lets you build AI-powered workflows with a visual editor. But there's no built-in way to:

- **Export** the prompts, logic, and step configuration as text
- **Visualize** the flow as a graph with data dependencies
- **Diff** two versions of a flow to see what changed
- **Document** flows for reviews, audits, or knowledge sharing

This tool fills that gap.

## Screenshots

### Paste & Parse

Ctrl+A your flow in the Quick Flows editor, paste it here, and AI extracts the full structure. Choose from five AI providers (Anthropic, OpenAI, Gemini, Perplexity, or AWS Bedrock) and switch between them at any time.

![Paste Phase](docs/screenshots/01-paste-phase.png)

### Flow Diff

Compare two versions of a flow with word-level inline diffs on prompts. Added, removed, and modified steps are highlighted, and you can expand any change to see exactly what changed.

![Diff Phase](docs/screenshots/02-diff-phase.png)

### Interactive Flow Graph

Visualize your flow as a color-coded directed graph. Each step type has its own color, `@references` show as dashed edges, and reasoning groups render as sub-graphs. Click any node to see the full prompt in a detail panel.

![Flow Graph](docs/screenshots/03-flow-graph.png)

### Multi-Format Export

Export to Markdown (documentation), Mermaid (flowchart diagrams for GitHub/Quip), or JSON (canonical, re-importable). Copy to clipboard or download as a file.

![Export Phase](docs/screenshots/04-export-phase.png)

### One-Click Bookmarklet

Drag the bookmarklet to your bookmarks bar. One click on any Quick Flows editor page copies the content to your clipboard — no Ctrl+A needed.

## Features

| Feature               | Description                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| 🧠 AI-Powered Parsing | Paste raw editor content → structured flow with steps, groups, conditions |
| 🔀 Interactive Graph  | React Flow-powered DAG with color-coded nodes, @reference edges, minimap  |
| 🔍 Flow Diffing       | Side-by-side comparison with word-level diffs (added/removed/modified)    |
| 📄 Markdown Export    | Human-readable documentation with full prompt text                        |
| 🧜 Mermaid Export     | Flowchart diagrams that render in GitHub, Quip, mermaid.live              |
| { } JSON Export       | Canonical format for version control and re-import                        |
| 🔖 Bookmarklet        | One-click content extraction from the Quick Flows editor                  |
| 🧩 Browser Extension  | Chrome/Edge extension for one-click extraction with popup UI              |
| ✏️ Review & Edit      | Reorder steps, edit prompts, adjust settings before export                |
| 🔄 Reasoning Groups   | Full support for conditional logic groups with run conditions             |
| 🌗 Light & Dark Mode  | Theme toggle (light/dark/system) with localStorage persistence            |

## Supported Step Types

| Type                | Icon | Description                |
| ------------------- | ---- | -------------------------- |
| Chat Agent          | 🤖   | Conversational AI agent    |
| General Knowledge   | 🧠   | LLM-powered knowledge step |
| Web Search          | 🌐   | Internet search step       |
| UI Agent            | 🖱️   | Browser automation         |
| Create Image        | 🖼️   | Image generation           |
| Quick Suite Data    | 📊   | Internal data queries      |
| Dashboards & Topics | 📈   | BI dashboard integration   |
| Application Actions | ⚡   | External system actions    |
| User Input (Text)   | 📝   | Text input from user       |
| User Input (Files)  | 📎   | File upload from user      |

## Quick Start

### Prerequisites

- Node.js 22 or newer
- npm 10 or newer

```bash
git clone https://github.com/florianhorner/Quick-Flow-Exporter.git
cd Quick-Flow-Exporter
npm ci
npm run dev
```

Open `http://localhost:5173` in your browser.

> **Note:** `npm run dev` starts the Vite frontend only. To use AI parsing, you also need the proxy running in a separate terminal — see [AI Proxy Setup](#ai-proxy-setup) below.

## Browser Extension (Chrome / Edge)

A Manifest V3 browser extension is included for one-click flow extraction — no bookmarklet needed.

### Install (developer mode)

1. Build the extension:
   ```bash
   npm run build:extension
   ```
2. Open `chrome://extensions` (or `edge://extensions`)
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `extension/dist/` directory

### Usage

1. Navigate to a Quick Flows editor page
2. Click the extension icon in your toolbar
3. Click **Extract Flow** — the popup shows a preview of the extracted text
4. **Copy to Clipboard** to paste into the web app, or **Open in Exporter** to launch the app with the data pre-loaded

## AI Proxy Setup

The parser uses AI to extract structured data from raw pasted text. Requests go through a local proxy to keep API keys out of the browser. Five providers are supported out of the box.

### Anthropic (Claude) — default

```bash
ANTHROPIC_API_KEY=sk-... npx tsx server/proxy.ts
```

### OpenAI

```bash
PROVIDER=openai OPENAI_API_KEY=sk-... npx tsx server/proxy.ts
```

### Google Gemini

```bash
PROVIDER=gemini GEMINI_API_KEY=AIza... npx tsx server/proxy.ts
```

### Perplexity

```bash
PROVIDER=perplexity PERPLEXITY_API_KEY=pplx-... npx tsx server/proxy.ts
```

### AWS Bedrock

```bash
npm install @aws-sdk/client-bedrock-runtime
PROVIDER=bedrock AWS_REGION=us-east-1 npx tsx server/proxy.ts
```

Uses your default AWS credentials (`~/.aws/credentials` or environment variables).

### Per-request provider selection

The `PROVIDER` env var sets the server default, but users can switch providers from the UI at any time. The frontend sends a `provider` field in each request, so a single proxy instance can serve all providers simultaneously — just set the API keys you want available:

```bash
ANTHROPIC_API_KEY=sk-... OPENAI_API_KEY=sk-... PERPLEXITY_API_KEY=pplx-... npx tsx server/proxy.ts
```

### Environment variables

| Variable             | Default                                     | Description                  |
| -------------------- | ------------------------------------------- | ---------------------------- |
| `PROVIDER`           | `anthropic`                                 | Default AI provider          |
| `ANTHROPIC_API_KEY`  | —                                           | Anthropic API key            |
| `ANTHROPIC_MODEL`    | `claude-sonnet-4-20250514`                  | Anthropic model ID           |
| `OPENAI_API_KEY`     | —                                           | OpenAI API key               |
| `OPENAI_MODEL`       | `gpt-4o`                                    | OpenAI model ID              |
| `GEMINI_API_KEY`     | —                                           | Google Gemini API key        |
| `GEMINI_MODEL`       | `gemini-2.5-flash`                          | Gemini model ID              |
| `PERPLEXITY_API_KEY` | —                                           | Perplexity API key           |
| `PERPLEXITY_MODEL`   | `sonar-pro`                                 | Perplexity model ID          |
| `AWS_REGION`         | `us-east-1`                                 | AWS region for Bedrock       |
| `BEDROCK_MODEL_ID`   | `anthropic.claude-3-5-sonnet-20241022-v2:0` | Bedrock model ID             |
| `PORT`               | `3001`                                      | Proxy server port            |
| `RATE_LIMIT`         | `20`                                        | Requests per 60s per IP      |
| `TRUST_PROXY`        | `false`                                     | Trust X-Forwarded-For header |
| `CORS_ORIGIN`        | `http://localhost:5173`                     | Allowed CORS origin          |

> The Vite dev server proxies `/api` requests to `http://localhost:3001` automatically.

## How It Works

The app is a six-phase pipeline. Each phase is a tab in the navigation header — you can jump between them freely once a flow is parsed.

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  1. Paste │──▶│ 2. Groups│──▶│ 3. Review│──▶│ 4. Export│   │  5. Diff │
│  & Parse  │   │ (if any) │   │  & Edit  │   │MD/MMD/JSON│   │ (any two │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   │  flows)  │
                                     │                        └──────────┘
                               ┌─────┴─────┐
                               │  6. Graph  │
                               │(interactive│
                               │    DAG)    │
                               └───────────┘
```

1. **Paste** — Copy the raw content from the Quick Flows editor (Ctrl+A → Ctrl+C) and paste it here. Select a provider and enter your API key.
2. **Parse** — The proxy sends the text to your chosen AI provider (up to 500 KB, 60s timeout). The AI returns a structured JSON flow.
3. **Groups** — If reasoning groups are detected, the app prompts you to paste their instructions for a second extraction pass. Skip this step if there are no groups.
4. **Review** — Edit steps, reorder, tweak prompts, and adjust settings. Changes here propagate to all exports.
5. **Graph** — Visualize the flow as an interactive directed acyclic graph. Color-coded nodes, dashed `@reference` edges, subgraphs for groups. Click any node for a detail panel.
6. **Export** — Copy or download as Markdown (human-readable docs), Mermaid (renders in GitHub/Quip), or JSON (version-control friendly).
7. **Diff** — Paste any two raw flow versions and compare them. Word-level inline diffs highlight exactly what changed in each prompt. Diff is independent — you don't need a parsed flow loaded first.

## Project Structure

```
src/
├── types.ts                     # TypeScript type definitions
├── constants.ts                 # Step types, output prefs, run conditions
├── context/
│   └── ThemeContext.tsx           # Light/dark/system theme provider
├── lib/
│   ├── ai.ts                    # AI proxy client
│   ├── diff.ts                  # Flow diff engine (word-level diffs)
│   ├── flow.ts                  # Flow/Step/Group factories & helpers
│   ├── markdown.ts              # Markdown export generator
│   ├── mermaid.ts               # Mermaid flowchart generator
│   ├── parser.ts                # AI-powered flow & group parsing
│   ├── prompts.ts               # LLM system prompts
│   └── storage.ts               # Export history persistence
├── components/
│   ├── BookmarkletPanel.tsx      # Draggable bookmarklet for Quick Flows
│   ├── DiffPhase.tsx             # Side-by-side flow comparison UI
│   ├── ExportPhase.tsx           # Multi-format export (MD/Mermaid/JSON)
│   ├── FlowGraph.tsx             # Interactive React Flow graph
│   ├── GroupCard.tsx             # Editable reasoning group
│   ├── GroupInstructionCard.tsx   # AI extraction for group instructions
│   ├── GroupsPhase.tsx           # Group instruction extraction wizard
│   ├── PastePhase.tsx            # Raw text paste & parse
│   ├── ReviewPhase.tsx           # Full flow editor
│   ├── StepCard.tsx              # Collapsible step editor
│   ├── StepFields.tsx            # Step-type-specific form fields
│   └── ErrorBoundary.tsx         # Catch rendering errors gracefully
├── App.tsx                       # Main app with phase navigation
├── main.tsx                      # Entry point
└── index.css                     # Tailwind imports + light/dark body styles
server/
├── proxy.ts                      # AI proxy server (Anthropic, OpenAI, Gemini, Perplexity, Bedrock)
└── proxy-utils.ts                # Shared proxy utilities (rate limiter, validation)
extension/
├── manifest.json                 # Chrome/Edge Manifest V3 config
├── popup/                        # Extension popup (HTML, CSS, TypeScript)
├── background/                   # Service worker for tab management
└── icons/                        # Extension icons (16/48/128 px)
scripts/
├── build-extension.mjs           # esbuild bundler for the extension
├── generate-icons.mjs            # Programmatic extension icon generation
├── take-screenshots.mjs          # Automated screenshot capture for docs
└── conductor-setup.sh            # Conductor workspace setup script
vercel.json                       # Vercel SPA deployment config
conductor.json                    # Conductor multi-agent workspace config
```

## Tech Stack

- **React 19** + TypeScript
- **Tailwind CSS** for styling
- **React Flow** for the interactive graph visualization
- **diff-match-patch** for word-level text diffing
- **Vite** for dev/build tooling

## Scripts

| Command                   | Description                                        |
| ------------------------- | -------------------------------------------------- |
| `npm run dev`             | Start Vite frontend at localhost:5173              |
| `npm run build`           | Type-check and build for production                |
| `npm run build:extension` | Bundle browser extension to `extension/dist`       |
| `npm run preview`         | Preview production build                           |
| `npm run lint`            | Run ESLint                                         |
| `npm run test`            | Run Vitest test suite once                         |
| `npm run test:watch`      | Run Vitest in watch mode (re-runs on file changes) |
| `npm run format:check`    | Check formatting with Prettier                     |
| `npm run typecheck`       | Type-check without emitting (`tsc --noEmit`)       |

## Roadmap

- [x] ~~Browser extension (Chrome/Edge)~~ for zero-friction extraction
- [x] ~~Light & dark mode~~ with system preference detection
- [ ] Flow analytics (prompt complexity, reference graph completeness, cost estimation)
- [ ] Shareable links (encode flow in URL for Slack/email sharing)
- [ ] Keyboard shortcuts
- [ ] `npx quick-flow-exporter` for zero-setup local usage

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
