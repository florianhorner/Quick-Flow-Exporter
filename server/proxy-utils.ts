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

export class ProxyHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ProxyHttpError';
    this.status = status;
  }
}

const PROVIDER_NAMES: Record<Provider, string> = {
  anthropic: 'Anthropic',
  bedrock: 'AWS Bedrock',
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  perplexity: 'Perplexity',
};

function providerErrorMessage(provider: Provider, status: number): string {
  const providerName = PROVIDER_NAMES[provider];

  if (status === 401) {
    if (provider === 'anthropic') {
      return 'Anthropic API key is invalid or expired. Check it at console.anthropic.com.';
    }
    if (provider === 'bedrock') {
      return 'AWS credentials for Bedrock are invalid or expired. Check your AWS credentials and try again.';
    }
    return `${providerName} API key is invalid or expired. Check your ${providerName} credentials and try again.`;
  }

  if (status === 403) {
    if (provider === 'bedrock') {
      return 'AWS Bedrock access denied. Verify IAM permissions and model access.';
    }
    return `${providerName} request was denied. Check key permissions, billing, and model access.`;
  }

  if (status === 429) {
    return `${providerName} rate limit hit. Wait a minute and retry, or switch providers.`;
  }

  return `${providerName} API request failed (${status}). Check provider configuration and try again.`;
}

export function createClientConfigError(message: string, status = 400): ProxyHttpError {
  return new ProxyHttpError(status, message);
}

export function createProviderHttpError(
  provider: Provider,
  status: number
): ProxyHttpError {
  return new ProxyHttpError(status, providerErrorMessage(provider, status));
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

interface RateLimitIpOptions {
  trustProxy: boolean;
  forwardedFor?: string | string[];
  remoteAddress?: string | null;
  trustedProxyHops?: number;
}

export function getRateLimitIp({
  trustProxy,
  forwardedFor,
  remoteAddress,
  trustedProxyHops = 1,
}: RateLimitIpOptions): string {
  if (!trustProxy) {
    return remoteAddress ?? 'unknown';
  }

  const hopCount =
    Number.isInteger(trustedProxyHops) && trustedProxyHops > 0 ? trustedProxyHops : 1;
  const forwardedIps = (Array.isArray(forwardedFor) ? forwardedFor : [forwardedFor])
    .filter((value): value is string => typeof value === 'string')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  if (forwardedIps.length >= hopCount) {
    return forwardedIps[forwardedIps.length - hopCount]!;
  }

  return remoteAddress ?? 'unknown';
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

/** Validates a Gemini model name to prevent path traversal via env var injection. */
export function validateGeminiModel(model: string): string {
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) {
    throw new Error(`Invalid GEMINI_MODEL value: ${model}`);
  }
  return model;
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
