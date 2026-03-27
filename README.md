# ⚡ QuickSuite Exporter

Export your [QuickSuite](https://quicksuite.example.com) Flows into clean, readable Markdown — perfect for documentation, version control, and sharing.

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![React](https://img.shields.io/badge/React-19-61dafb)

## What It Does

QuickSuite's Flow Editor is great for building flows, but there's no built-in way to export them as text. This tool fixes that:

1. **Paste** — Copy the raw content from QuickSuite's Flow Editor (Ctrl+A → Ctrl+C)
2. **Parse** — AI extracts the structured flow definition (steps, groups, conditions)
3. **Review** — Edit steps, reorder, tweak prompts
4. **Export** — Copy or download as Markdown

Supports all step types: Chat Agent, General Knowledge, Web Search, UI Agent, Create Image, Quick Suite Data, Dashboards & Topics, Application Actions, and User Input (Text/Files).

## Quick Start

```bash
git clone https://github.com/your-username/Quick-Flow-Exporter.git
cd Quick-Flow-Exporter
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## AI Proxy Setup

The app uses AI to parse raw pasted text into structured flow data. To keep your API key out of the browser, requests go through a small local proxy server.

### Option A: Anthropic

```bash
ANTHROPIC_API_KEY=sk-... npx tsx server/proxy.ts
```

### Option B: AWS Bedrock

```bash
npm install @aws-sdk/client-bedrock-runtime
PROVIDER=bedrock AWS_REGION=us-east-1 npx tsx server/proxy.ts
```

Uses your default AWS credentials (`~/.aws/credentials` or environment variables).

### Option C: Any OpenAI-compatible API

Adapt `server/proxy.ts` — it's a single function swap. PRs welcome.

> The Vite dev server proxies `/api` requests to `http://localhost:3001` automatically.

## Project Structure

```
src/
├── types.ts                    # TypeScript type definitions
├── constants.ts                # Step types, output prefs, sources
├── lib/
│   ├── ai.ts                   # AI proxy client
│   ├── flow.ts                 # Flow/Step/Group factories & helpers
│   ├── markdown.ts             # Markdown generation
│   ├── parser.ts               # AI-powered flow & group parsing
│   ├── prompts.ts              # LLM system prompts
│   └── storage.ts              # Export history persistence
├── components/
│   ├── ExportPhase.tsx          # Markdown preview, copy & download
│   ├── GroupCard.tsx            # Editable reasoning group
│   ├── GroupInstructionCard.tsx  # AI extraction for group instructions
│   ├── GroupsPhase.tsx          # Group instruction extraction wizard
│   ├── PastePhase.tsx           # Raw text paste & parse
│   ├── ReviewPhase.tsx          # Full flow editor
│   ├── StepCard.tsx             # Collapsible step editor
│   └── StepFields.tsx           # Step-type-specific form fields
├── App.tsx                      # Main app with phase navigation
├── main.tsx                     # Entry point
└── index.css                    # Tailwind imports
server/
└── proxy.ts                     # AI proxy server (Anthropic / Bedrock)
```

## Tech Stack

- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for dev/build tooling

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Contributing

Contributions are welcome. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
