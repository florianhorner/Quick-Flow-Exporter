# AI Proxy Setup

[&larr; Back to README](../README.md)

The parser uses AI to extract structured data from raw pasted text. Requests go through a local proxy to keep API keys out of the browser. Five providers are supported out of the box.

The hosted Vercel demo is example-only and does not run this proxy. To parse your own flow, run the app locally.

## One-command local startup

```bash
ANTHROPIC_API_KEY=sk-... npm start
```

`npm start` runs both the Vite UI and the local proxy and inherits whatever API keys you prefix. Each provider section below is the same `npm start`, just with that provider's env vars. To run only the proxy (e.g. against a separately served UI), replace `npm start` with `npx tsx server/proxy.ts`.

## Anthropic (Claude) — default

```bash
ANTHROPIC_API_KEY=sk-... npm start
```

## OpenAI

```bash
PROVIDER=openai OPENAI_API_KEY=sk-... npm start
```

## Google Gemini

```bash
PROVIDER=gemini GEMINI_API_KEY=AIza... npm start
```

## Perplexity

```bash
PROVIDER=perplexity PERPLEXITY_API_KEY=pplx-... npm start
```

## AWS Bedrock

```bash
npm install @aws-sdk/client-bedrock-runtime
PROVIDER=bedrock AWS_REGION=us-east-1 npm start
```

Uses your default AWS credentials (`~/.aws/credentials` or environment variables).

## Per-request provider selection

The `PROVIDER` env var sets the server default, but users can switch providers from the UI at any time. The frontend sends a `provider` field in each request, so a single proxy instance can serve all providers simultaneously — just set the API keys you want available:

```bash
ANTHROPIC_API_KEY=sk-... OPENAI_API_KEY=sk-... PERPLEXITY_API_KEY=pplx-... npm start
```

## Environment variables

| Variable             | Default                                     | Description                                                                                                         |
| -------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `PROVIDER`           | `anthropic`                                 | Default AI provider                                                                                                 |
| `ANTHROPIC_API_KEY`  | —                                           | Anthropic API key                                                                                                   |
| `ANTHROPIC_MODEL`    | `claude-sonnet-4-20250514`                  | Anthropic model ID                                                                                                  |
| `OPENAI_API_KEY`     | —                                           | OpenAI API key                                                                                                      |
| `OPENAI_MODEL`       | `gpt-4o`                                    | OpenAI model ID                                                                                                     |
| `GEMINI_API_KEY`     | —                                           | Google Gemini API key                                                                                               |
| `GEMINI_MODEL`       | `gemini-2.5-flash`                          | Gemini model ID                                                                                                     |
| `PERPLEXITY_API_KEY` | —                                           | Perplexity API key                                                                                                  |
| `PERPLEXITY_MODEL`   | `sonar-pro`                                 | Perplexity model ID                                                                                                 |
| `AWS_REGION`         | `us-east-1`                                 | AWS region for Bedrock                                                                                              |
| `BEDROCK_MODEL_ID`   | `anthropic.claude-3-5-sonnet-20241022-v2:0` | Bedrock model ID                                                                                                    |
| `PORT`               | `3001`                                      | Port the proxy listens on; the Vite dev server targets the same value. Takes precedence over `PROXY_PORT`.          |
| `PROXY_PORT`         | `3001`                                      | Fallback port for both proxy and Vite when `PORT` is unset (Conductor sets this per workspace to avoid collisions). |
| `RATE_LIMIT`         | `20`                                        | Requests per 60s per IP                                                                                             |
| `TRUST_PROXY`        | `false`                                     | Trust X-Forwarded-For header                                                                                        |
| `TRUST_PROXY_HOPS`   | `1`                                         | Trusted proxy hops from right                                                                                       |
| `CORS_ORIGIN`        | `http://localhost:5173`                     | Allowed CORS origin                                                                                                 |

> The Vite dev server proxies `/api` to the same port the proxy binds — `PORT`, else `PROXY_PORT`, else `3001` — so the UI and proxy always agree.
>
> If `TRUST_PROXY=true`, set `TRUST_PROXY_HOPS` to the number of trusted proxies that append to `X-Forwarded-For` between the browser and this app. `1` fits a single reverse proxy; larger chains such as CDN + ingress typically need `2` or more.
