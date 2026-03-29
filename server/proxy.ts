/**
 * AI proxy server — keeps API keys server-side.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx server/proxy.ts
 *
 * For AWS Bedrock:
 *   PROVIDER=bedrock AWS_REGION=us-east-1 npx tsx server/proxy.ts
 */

import http from 'node:http';
import {
  createRateLimiter,
  validateProxyRequest,
  type ProxyRequest,
} from './proxy-utils';

const PORT = Number(process.env.PORT ?? 3001);
const PROVIDER = process.env.PROVIDER ?? 'anthropic';
const MAX_BODY_BYTES = 512_000; // 500 KB
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = Number(process.env.RATE_LIMIT ?? 20);

// ── Rate limiter (per-IP, sliding window) ────────────────────────────────────

const rateLimiter = createRateLimiter(RATE_LIMIT, RATE_WINDOW_MS);

// Clean up stale entries every 5 minutes
setInterval(() => {
  rateLimiter.prune();
}, 300_000);

// ── Anthropic provider ───────────────────────────────────────────────────────

async function callAnthropic(req: ProxyRequest, clientKey?: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY || clientKey;
  if (!key)
    throw new Error('No API key. Set ANTHROPIC_API_KEY or provide one in the UI.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
      max_tokens: req.maxTokens,
      system: req.system,
      messages: [{ role: 'user', content: req.userMessage }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    content: Array<{ text?: string }>;
  };
  return data.content.map((c) => c.text ?? '').join('');
}

// ── AWS Bedrock provider ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function callBedrock(req: ProxyRequest, _clientKey?: string): Promise<string> {
  // Optional dependency — install with: npm install @aws-sdk/client-bedrock-runtime
  const mod = await (import('@aws-sdk/client-bedrock-runtime' as string) as Promise<{
    BedrockRuntimeClient: new (config: { region: string }) => {
      send: (cmd: unknown) => Promise<{ body: Uint8Array }>;
    };
    InvokeModelCommand: new (input: {
      modelId: string;
      contentType: string;
      accept: string;
      body: Uint8Array;
    }) => unknown;
  }>);
  const { BedrockRuntimeClient, InvokeModelCommand } = mod;

  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
  });

  const modelId =
    process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-5-sonnet-20241022-v2:0';

  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: req.maxTokens,
    system: req.system,
    messages: [{ role: 'user', content: req.userMessage }],
  });

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: new TextEncoder().encode(body),
  });

  const response = await client.send(command);
  const decoded = new TextDecoder().decode(response.body);
  const data = JSON.parse(decoded) as {
    content: Array<{ text?: string }>;
  };
  return data.content.map((c) => c.text ?? '').join('');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const callProvider: (req: ProxyRequest, clientKey?: string) => Promise<string> =
  PROVIDER === 'bedrock' ? callBedrock : callAnthropic;

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    let settled = false;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        settled = true;
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks).toString('utf-8'));
      }
    });
    req.on('error', (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
  });
}

// ── Server ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');

  // CORS
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    json(res, 200, { status: 'ok', provider: PROVIDER });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/parse') {
    json(res, 404, { error: 'Not found' });
    return;
  }

  // Content-Type check
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('application/json')) {
    json(res, 415, { error: 'Content-Type must be application/json' });
    return;
  }

  // Rate limit — only trust X-Forwarded-For behind a known reverse proxy
  const trustProxy = process.env.TRUST_PROXY === 'true';
  const ip = trustProxy
    ? ((req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      'unknown')
    : (req.socket.remoteAddress ?? 'unknown');

  if (rateLimiter.isRateLimited(ip)) {
    json(res, 429, { error: 'Too many requests. Try again in a minute.' });
    return;
  }

  try {
    const raw = await readBody(req);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      json(res, 400, { error: 'Invalid JSON' });
      return;
    }

    let validated: ProxyRequest;
    try {
      validated = validateProxyRequest(parsed);
    } catch (e) {
      json(res, 400, { error: e instanceof Error ? e.message : String(e) });
      return;
    }

    const clientKey = (req.headers['x-api-key'] as string) || undefined;
    const text = await callProvider(validated, clientKey);
    json(res, 200, { text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${new Date().toISOString()}] Error:`, msg);
    json(res, 500, { error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`AI proxy (${PROVIDER}) listening on http://localhost:${PORT}`);
  console.log(`Rate limit: ${RATE_LIMIT} requests per ${RATE_WINDOW_MS / 1000}s`);
});
