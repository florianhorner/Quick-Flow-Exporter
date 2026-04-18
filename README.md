<p align="center">
  <img src="docs/banner.png" alt="Quick Flow Exporter — extract, visualize, diff, and document Amazon Quick Flows" width="880" />
</p>

<h1 align="center">Quick Flow Exporter</h1>

<p align="center">
  <strong>Export, diff, and visualize <a href="https://aws.amazon.com/quick/flows/">Amazon Quick Flows</a>.</strong><br />
  Paste a flow. Get Markdown, Mermaid, JSON, an interactive graph, and side-by-side diffs.
</p>

<p align="center">
  <a href="https://quick-flow-exporter.vercel.app/"><img alt="Live demo" src="https://img.shields.io/badge/Live%20demo-→-2563eb?style=for-the-badge" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#features">Features</a> ·
  <a href="#contributing">Contribute</a>
</p>

<p align="center">
  <a href="https://github.com/florianhorner/Quick-Flow-Exporter/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/florianhorner/Quick-Flow-Exporter/ci.yml?branch=main&label=CI&color=2563eb" /></a>
  <a href="https://github.com/florianhorner/Quick-Flow-Exporter/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/florianhorner/Quick-Flow-Exporter?style=flat&color=2563eb" /></a>
  <a href="https://github.com/florianhorner/Quick-Flow-Exporter/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/florianhorner/Quick-Flow-Exporter?color=2563eb" /></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-64748b" /></a>
  <img alt="TypeScript 5.9" src="https://img.shields.io/badge/TypeScript-5.9-64748b" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-64748b" />
</p>

---

## Why

**The native Quick Flows editor can't export, diff, or visualize. This does all three.**

Amazon Quick Flows is AWS's visual builder for AI workflows (formerly QuickSuite). Review a teammate's flow without chasing ten tabs. Diff last week's version against today's. Drop the full flow into a design doc as Markdown or Mermaid.

## Quick Start

**Try it online** → [quick-flow-exporter.vercel.app](https://quick-flow-exporter.vercel.app/). Bring an API key from [Anthropic](https://console.anthropic.com/), [OpenAI](https://platform.openai.com/api-keys), [Gemini](https://aistudio.google.com/app/apikey), or [Perplexity](https://www.perplexity.ai/settings/api).

**Run locally** (Node.js 22+, npm 10+):

```bash
git clone https://github.com/florianhorner/Quick-Flow-Exporter.git
cd Quick-Flow-Exporter
npm ci

# Terminal 1 — frontend
npm run dev

# Terminal 2 — AI proxy (Anthropic default)
ANTHROPIC_API_KEY=sk-... npx tsx server/proxy.ts
```

Open `http://localhost:5173`. For OpenAI, Gemini, Perplexity, or Bedrock see [AI Proxy Setup](docs/AI_PROXY_SETUP.md).

> If **Parse & Extract** is greyed out, the proxy isn't running — start Terminal 2.

## Features

- 🧠 **Five AI providers** — Anthropic, OpenAI, Gemini, Perplexity, AWS Bedrock. Switch per request; keys stay on your machine via local proxy.
- 🔀 **Dependency graph** — color-coded DAG with `@reference` edges, reasoning-group subgraphs, and a minimap.
- 🔍 **Version diffs** — word-level inline changes between any two flow versions, no git required.
- 📄 **Three export formats** — Markdown for docs, Mermaid for GitHub and Quip, JSON for round-tripping.
- ✏️ **Edit before export** — reorder steps, refine prompts, adjust settings.
- 🧩 **One-click capture** — Chrome/Edge extension pulls flows straight from the editor.
- 🌗 **Light & dark mode** — system-detected, persisted.

See [docs/STEP_TYPES.md](docs/STEP_TYPES.md) for every supported step type.

## Screenshots

Copy your flow from the Quick Flows editor (Ctrl+A → Ctrl+C), or use the [Chrome/Edge extension](docs/BROWSER_EXTENSION.md) for one-click capture.

| 1. Paste a flow, get structured steps               | 2. Diff two versions, word-level                  |
| --------------------------------------------------- | ------------------------------------------------- |
| ![Paste Phase](docs/screenshots/01-paste-phase.png) | ![Diff Phase](docs/screenshots/02-diff-phase.png) |

| 3. Explore dependencies as a graph                | 4. Export to Markdown, Mermaid, JSON                  |
| ------------------------------------------------- | ----------------------------------------------------- |
| ![Flow Graph](docs/screenshots/03-flow-graph.png) | ![Export Phase](docs/screenshots/04-export-phase.png) |

## Resources

- **[Architecture](docs/ARCHITECTURE.md)** — the six-phase pipeline and project layout
- **[AI Proxy Setup](docs/AI_PROXY_SETUP.md)** — provider configs, env vars, per-request switching
- **[Browser Extension](docs/BROWSER_EXTENSION.md)** — install the Chrome/Edge capture extension
- **[Step Types](docs/STEP_TYPES.md)** — every Quick Flows step type and how it renders
- **[Scripts](docs/SCRIPTS.md)** — npm scripts, tech stack, prerequisites

## Roadmap

**Shipped**

- [x] Browser extension (Chrome/Edge)
- [x] Light & dark mode

**Next**

- [ ] Flow analytics (prompt complexity, reference graph completeness, cost estimation)
- [ ] Shareable links (encode flow in URL for Slack/email sharing)

**Nice-to-have**

- [ ] Keyboard shortcuts
- [ ] `npx quick-flow-exporter` for zero-setup local usage

## Contributing

Issues, PRs, and feedback all move this forward.

1. Fork, clone, and run `npm ci`.
2. Branch off main: `git checkout -b feat/your-idea`.
3. Before opening a PR: `npm run lint && npm run test && npm run typecheck`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

## License

[MIT](LICENSE)

<!--
## Star history

Uncomment once the repo hits ~50 stars — shows growth curve.

<a href="https://star-history.com/#florianhorner/Quick-Flow-Exporter&Date">
  <img src="https://api.star-history.com/svg?repos=florianhorner/Quick-Flow-Exporter&type=Date" alt="Star history" />
</a>
-->
