import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseWithAI } from '../ai';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('parseWithAI', () => {
  it('sends correct request and returns text', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ text: 'parsed result' })),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await parseWithAI({
      system: 'You are a parser',
      userMessage: 'Parse this',
      maxTokens: 2000,
    });

    expect(result).toBe('parsed result');
    expect(mockFetch).toHaveBeenCalledWith('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: 'You are a parser',
        userMessage: 'Parse this',
        maxTokens: 2000,
        provider: 'anthropic',
      }),
      signal: expect.any(AbortSignal),
    });
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({ error: 'Proxy says no' })),
      })
    );

    await expect(parseWithAI({ system: 's', userMessage: 'm' })).rejects.toThrow(
      'Proxy says no'
    );
  });

  it('falls back to status-only error when non-JSON body is returned', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: () => Promise.resolve('upstream exploded'),
      })
    );

    await expect(parseWithAI({ system: 's', userMessage: 'm' })).rejects.toThrow(
      'AI proxy request failed (502).'
    );
  });

  it('throws on unexpected response shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ result: 'wrong shape' })),
      })
    );

    await expect(parseWithAI({ system: 's', userMessage: 'm' })).rejects.toThrow(
      'Unexpected response shape'
    );
  });

  it('defaults maxTokens to 4096', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ text: 'ok' })),
    });
    vi.stubGlobal('fetch', mockFetch);

    await parseWithAI({ system: 's', userMessage: 'm' });

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.maxTokens).toBe(4096);
    expect(body.provider).toBe('anthropic');
  });

  it('maps SPA fallbacks to a proxy setup message (not the demo message)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 405,
        text: () => Promise.resolve('<!doctype html><html></html>'),
      })
    );

    // Reachable only when NOT in demo mode, so the message must not claim the
    // user is on the hosted demo — it should point at the local proxy fix.
    await expect(parseWithAI({ system: 's', userMessage: 'm' })).rejects.toThrow(
      'The AI proxy is not reachable'
    );
    await expect(parseWithAI({ system: 's', userMessage: 'm' })).rejects.toThrow(
      'Start the proxy'
    );
  });

  it('does not call the proxy in demo mode', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true');
    vi.resetModules();
    const demoFetch = vi.fn();
    vi.stubGlobal('fetch', demoFetch);
    const { parseWithAI: parseWithAIInDemoMode } = await import('../ai');

    await expect(
      parseWithAIInDemoMode({ system: 's', userMessage: 'm' })
    ).rejects.toThrow('hosted demo uses bundled examples only');
    expect(demoFetch).not.toHaveBeenCalled();
  });
});
