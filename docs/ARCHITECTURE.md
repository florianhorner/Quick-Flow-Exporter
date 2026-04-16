# Architecture

[&larr; Back to README](../README.md)

How Quick Flow Exporter is built, and how data flows through it.

## How It Works

The app is a six-phase pipeline. Each phase is a tab in the navigation header — you can jump between them freely once a flow is parsed.

```text
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ 1. Paste │──▶│ 2. Groups│──▶│ 3. Review│──▶│ 4. Graph │──▶│ 5. Export│
│ & Parse  │   │ (if any) │   │  & Edit  │   │(interactive  │MD/MMD/JSON
└──────────┘   └──────────┘   └──────────┘   │    DAG)   │  └──────────┘
                                             └──────────┘

                              ┌──────────┐
                              │ 6. Diff  │  (any two flows — independent)
                              └──────────┘
```

1. **Paste & Parse** — Copy the raw content from the Quick Flows editor (Ctrl+A → Ctrl+C), paste it, select a provider, and parse. The proxy sends the text to your chosen AI provider (up to 500 KB, with a 60s client-side timeout) and returns structured JSON.
2. **Groups** — If reasoning groups are detected, the app prompts you to paste their instructions for a second extraction pass. Skip this step if there are no groups.
3. **Review** — Edit steps, reorder, tweak prompts, and adjust settings. Changes here propagate to all exports.
4. **Graph** — Visualize the flow as an interactive directed acyclic graph. Color-coded nodes, dashed `@reference` edges, subgraphs for groups. Click any node for a detail panel.
5. **Export** — Copy or download as Markdown (human-readable docs), Mermaid (renders in GitHub/Quip), or JSON (version-control friendly).
6. **Diff** — Paste any two raw flow versions and compare them. Word-level inline diffs highlight exactly what changed in each prompt. Diff is independent — you don't need a parsed flow loaded first.

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
└── proxy-utils.ts                # Shared proxy utilities (rate limiter, validation, IP extraction)
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
