/**
 * AI parsing abstraction.
 *
 * Calls a local proxy at /api/parse so the API key never touches the browser.
 * Optionally, the user can provide an API key via the UI which gets sent
 * to the proxy as a fallback when no server-side env var is set.
 * See README.md for setup instructions.
 */

import {
  DEMO_MODE_MESSAGE,
  IS_DEMO_MODE,
  LOCAL_PROXY_FIX,
  PROXY_UNAVAILABLE_MESSAGE,
} from '../config';

const REQUEST_TIMEOUT_MS = 60_000; // 60 seconds
const API_KEY_STORAGE_KEY = 'qf-api-key';
const PROVIDER_STORAGE_KEY = 'qf-provider';

export type Provider = 'anthropic' | 'bedrock' | 'openai' | 'gemini' | 'perplexity';

export const PROVIDERS: { value: Provider; label: string; keyPlaceholder: string }[] = [
  { value: 'anthropic', label: 'Anthropic (Claude)', keyPlaceholder: 'sk-ant-...' },
  { value: 'openai', label: 'OpenAI', keyPlaceholder: 'sk-...' },
  { value: 'gemini', label: 'Google Gemini', keyPlaceholder: 'AIza...' },
  { value: 'perplexity', label: 'Perplexity', keyPlaceholder: 'pplx-...' },
  {
    value: 'bedrock',
    label: 'AWS Bedrock',
    keyPlaceholder: '(uses server-side AWS credentials)',
  },
];

// API keys use sessionStorage (cleared on tab close) to reduce the exposure
// window compared to localStorage. Provider preference is non-sensitive and
// uses localStorage for convenience.
export function getApiKey(): string {
  return sessionStorage.getItem(API_KEY_STORAGE_KEY) ?? '';
}

export function setApiKey(key: string): void {
  if (key) {
    sessionStorage.setItem(API_KEY_STORAGE_KEY, key);
  } else {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}

export function getProvider(): Provider {
  const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
  if (stored && PROVIDERS.some((p) => p.value === stored)) {
    return stored as Provider;
  }
  return 'anthropic';
}

export function setProvider(provider: Provider): void {
  localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
}

interface ParseRequest {
  system: string;
  userMessage: string;
  maxTokens?: number;
}

function extractProxyErrorMessage(raw: string): string | null {
  if (!raw.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'error' in parsed &&
      typeof (parsed as { error?: unknown }).error === 'string'
    ) {
      return (parsed as { error: string }).error;
    }
  } catch {
    return null;
  }
  return null;
}

function proxyUnavailableMessage(): string {
  // Only reachable when IS_DEMO_MODE is false (demo mode throws earlier), so the
  // user is on a local or self-hosted build whose proxy route is missing — never
  // the hosted demo. Lead with the proxy fact, not the demo message.
  return `${PROXY_UNAVAILABLE_MESSAGE} ${LOCAL_PROXY_FIX}`;
}

function isLikelyHtml(raw: string): boolean {
  // Only the opening tag matters — slice before lowercasing so we never scan a
  // multi-KB AI response body just to read its first few characters.
  const prefix = raw.trimStart().slice(0, 14).toLowerCase();
  return prefix.startsWith('<!doctype html') || prefix.startsWith('<html');
}

function errorWithCause(message: string, cause: unknown): Error {
  const error = new Error(message) as Error & { cause?: unknown };
  error.cause = cause;
  return error;
}

export async function parseWithAI({
  system,
  userMessage,
  maxTokens = 4096,
}: ParseRequest): Promise<string> {
  if (IS_DEMO_MODE) {
    throw new Error(DEMO_MODE_MESSAGE);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = getApiKey();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const provider = getProvider();

  try {
    let res: Response;
    try {
      res = await fetch('/api/parse', {
        method: 'POST',
        headers,
        body: JSON.stringify({ system, userMessage, maxTokens, provider }),
        signal: controller.signal,
      });
    } catch (e) {
      // fetch() rejects with a TypeError on network failure (proxy down / no
      // route). Map only that to the proxy-unavailable hint. AbortError
      // (timeout) and any later TypeError fall through to the outer handler so
      // genuine programming errors are not masked.
      if (e instanceof TypeError) {
        throw errorWithCause(proxyUnavailableMessage(), e);
      }
      throw e;
    }

    if (!res.ok) {
      const rawBody = await res.text().catch(() => '');
      const proxyError = extractProxyErrorMessage(rawBody);
      if (proxyError) {
        throw new Error(proxyError);
      }
      // 404/405 on /api/parse means the proxy route isn't served (static host
      // or missing function). Don't treat an HTML body on other statuses
      // (500/401/403 error pages) as "unreachable" — surface the real status.
      if (res.status === 404 || res.status === 405) {
        throw new Error(proxyUnavailableMessage());
      }
      throw new Error(`AI proxy request failed (${res.status}).`);
    }

    const rawBody = await res.text();
    if (isLikelyHtml(rawBody)) {
      throw new Error(proxyUnavailableMessage());
    }

    let data: unknown;
    try {
      data = JSON.parse(rawBody);
    } catch {
      throw new Error(proxyUnavailableMessage());
    }

    if (
      typeof data === 'object' &&
      data !== null &&
      'text' in data &&
      typeof (data as { text: string }).text === 'string'
    ) {
      return (data as { text: string }).text;
    }
    throw new Error('Unexpected response shape from AI proxy');
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw errorWithCause('AI request timed out after 60 seconds', e);
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
