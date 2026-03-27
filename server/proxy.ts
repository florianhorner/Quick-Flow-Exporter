/**
 * AI proxy server — keeps API keys server-side.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx server/proxy.ts
 *
 * For AWS Bedrock:
 *   PROVIDER=bedrock AWS_REGION=us-east-1 npx tsx server/proxy.ts
 */

import http from "node:http";

const PORT = Number(process.env.PORT ?? 3001);
const PROVIDER = process.env.PROVIDER ?? "anthropic";
const MAX_BODY_BYTES = 512_000; // 500 KB
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = Number(process.env.RATE_LIMIT ?? 20);

// ── Rate limiter (per-IP, sliding window) ────────────────────────────────────

const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    hits.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  hits.set(ip, timestamps);
  return false;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of hits) {
    const active = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
    if (active.length === 0) hits.delete(ip);
    else hits.set(ip, active);
  }
}, 300_000);

// ── Request types ────────────────────────────────────────────────────────────

interface ProxyRequest {
  system: string;
  userMessage: string;
  maxTokens?: number;
}

function validateRequest(body: unknown): ProxyRequest {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be a JSON object");
  }

  const obj = body as Record<string, unknown>;

  if (typeof obj.system !== "string" || obj.system.length === 0) {
    throw new Error("'system' must be a non-empty string");
  }
  if (typeof obj.userMessage !== "string" || obj.userMessage.length === 0) {
    throw new Error("'userMessage' must be a non-empty string");
  }
  if (obj.maxTokens !== undefined && (typeof obj.maxTokens !== "number" || obj.maxTokens < 1 || obj.maxTokens > 16000)) {
    throw new Error("'maxTokens' must be a number between 1 and 16000");
  }

  return {
    system: obj.system,
    userMessage: obj.userMessage,
    maxTokens: (obj.maxTokens as number | undefined) ?? 4096,
  };
}

// ── Anthropic provider ───────────────────────────────────────────────────────

async function callAnthropic(req: ProxyRequest): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
      max_tokens: req.maxTokens ?? 4096,
      system: req.system,
      messages: [{ role: "user", content: req.userMessage }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    content: Array<{ text?: string }>;
  };
  return data.content.map((c) => c.text ?? "").join("");
}

// ── AWS Bedrock provider ─────────────────────────────────────────────────────

async function callBedrock(req: ProxyRequest): Promise<string> {
  const { BedrockRuntimeClient, InvokeModelCommand } = await import(
    "@aws-sdk/client-bedrock-runtime"
  );

  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION ?? "us-east-1",
  });

  const modelId =
    process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-3-5-sonnet-20241022-v2:0";

  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: req.maxTokens ?? 4096,
    system: req.system,
    messages: [{ role: "user", content: req.userMessage }],
  });

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: new TextEncoder().encode(body),
  });

  const response = await client.send(command);
  const decoded = new TextDecoder().decode(response.body);
  const data = JSON.parse(decoded) as {
    content: Array<{ text?: string }>;
  };
  return data.content.map((c) => c.text ?? "").join("");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const callProvider = PROVIDER === "bedrock" ? callBedrock : callAnthropic;

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

// ── Server ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Cache-Control", "no-store");

  // CORS
  const origin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    json(res, 200, { status: "ok", provider: PROVIDER });
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/parse") {
    json(res, 404, { error: "Not found" });
    return;
  }

  // Content-Type check
  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.includes("application/json")) {
    json(res, 415, { error: "Content-Type must be application/json" });
    return;
  }

  // Rate limit
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  if (isRateLimited(ip)) {
    json(res, 429, { error: "Too many requests. Try again in a minute." });
    return;
  }

  try {
    const raw = await readBody(req);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      json(res, 400, { error: "Invalid JSON" });
      return;
    }

    const validated = validateRequest(parsed);
    const text = await callProvider(validated);
    json(res, 200, { text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${new Date().toISOString()}] Error:`, msg);
    json(res, 500, { error: msg });
  }
});

server.listen(PORT, () => {
  console.log(
    `AI proxy (${PROVIDER}) listening on http://localhost:${PORT}`,
  );
  console.log(`Rate limit: ${RATE_LIMIT} requests per ${RATE_WINDOW_MS / 1000}s`);
});
