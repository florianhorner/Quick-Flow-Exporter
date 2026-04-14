/**
 * AI parsing abstraction.
 *
 * Calls a local proxy at /api/parse so the API key never touches the browser.
 * Optionally, the user can provide an API key via the UI which gets sent
 * to the proxy as a fallback when no server-side env var is set.
 * See README.md for setup instructions.
 */

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

export async function parseWithAI({
  system,
  userMessage,
  maxTokens = 4096,
}: ParseRequest): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = getApiKey();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const provider = getProvider();

  try {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers,
      body: JSON.stringify({ system, userMessage, maxTokens, provider }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`AI proxy returned ${res.status}: ${body}`);
    }

    const data: unknown = await res.json();
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
      throw new Error('AI request timed out after 60 seconds');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
