export type Provider = 'anthropic' | 'bedrock' | 'openai' | 'gemini' | 'perplexity';

export const VALID_PROVIDERS: Provider[] = [
  'anthropic',
  'bedrock',
  'openai',
  'gemini',
  'perplexity',
];

export interface ProxyRequest {
  system: string;
  userMessage: string;
  maxTokens: number;
  provider?: Provider;
}

export function validateProxyRequest(body: unknown): ProxyRequest {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Request body must be a JSON object');
  }

  const obj = body as Record<string, unknown>;

  if (typeof obj.system !== 'string' || obj.system.length === 0) {
    throw new Error("'system' must be a non-empty string");
  }
  if (obj.system.length > 10_000) {
    throw new Error("'system' exceeds 10,000 character limit");
  }
  if (typeof obj.userMessage !== 'string' || obj.userMessage.length === 0) {
    throw new Error("'userMessage' must be a non-empty string");
  }
  if (obj.userMessage.length > 200_000) {
    throw new Error("'userMessage' exceeds 200,000 character limit");
  }
  if (
    obj.maxTokens !== undefined &&
    (typeof obj.maxTokens !== 'number' || obj.maxTokens < 1 || obj.maxTokens > 16000)
  ) {
    throw new Error("'maxTokens' must be a number between 1 and 16000");
  }
  if (
    obj.provider !== undefined &&
    (typeof obj.provider !== 'string' ||
      !VALID_PROVIDERS.includes(obj.provider as Provider))
  ) {
    throw new Error(`'provider' must be one of: ${VALID_PROVIDERS.join(', ')}`);
  }

  return {
    system: obj.system,
    userMessage: obj.userMessage,
    maxTokens: (obj.maxTokens as number | undefined) ?? 4096,
    provider: obj.provider as Provider | undefined,
  };
}

export interface RateLimiter {
  isRateLimited(ip: string): boolean;
  prune(): void;
}

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const hits = new Map<string, number[]>();

  const activeTimestamps = (timestamps: number[], now: number): number[] =>
    timestamps.filter((t) => now - t < windowMs);

  const isRateLimited = (ip: string): boolean => {
    const now = Date.now();
    const timestamps = activeTimestamps(hits.get(ip) ?? [], now);

    if (timestamps.length >= limit) {
      hits.set(ip, timestamps);
      return true;
    }

    timestamps.push(now);
    hits.set(ip, timestamps);
    return false;
  };

  const prune = () => {
    const now = Date.now();
    for (const [ip, timestamps] of hits) {
      const active = activeTimestamps(timestamps, now);
      if (active.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, active);
      }
    }
  };

  return { isRateLimited, prune };
}

/**
 * Extracts the client IP from headers when behind a trusted reverse proxy.
 * Uses the LAST segment of X-Forwarded-For (appended by the proxy) rather
 * than the first (client-supplied and forgeable), preventing rate-limit bypass.
 */
export function extractTrustedIp(
  xForwardedFor: string | undefined,
  fallback: string | undefined
): string {
  const segments = (xForwardedFor ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return segments[segments.length - 1] ?? fallback ?? 'unknown';
}
