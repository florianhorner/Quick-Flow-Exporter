import { describe, it, expect } from 'vitest';
import {
  createProviderHttpError,
  createRateLimiter,
  getRateLimitIp,
  ProxyHttpError,
  validateProxyRequest,
  VALID_PROVIDERS,
} from '../proxy-utils';

describe('proxy request validation', () => {
  it('accepts valid request', () => {
    const req = validateProxyRequest({
      system: 'You are a parser',
      userMessage: 'Parse this',
      maxTokens: 2000,
    });
    expect(req.system).toBe('You are a parser');
    expect(req.maxTokens).toBe(2000);
  });

  it('defaults maxTokens to 4096', () => {
    const req = validateProxyRequest({
      system: 's',
      userMessage: 'm',
    });
    expect(req.maxTokens).toBe(4096);
  });

  it('rejects null body', () => {
    expect(() => validateProxyRequest(null)).toThrow('JSON object');
  });

  it('rejects missing system', () => {
    expect(() => validateProxyRequest({ userMessage: 'm' })).toThrow('system');
  });

  it('rejects empty system', () => {
    expect(() => validateProxyRequest({ system: '', userMessage: 'm' })).toThrow(
      'system'
    );
  });

  it('rejects missing userMessage', () => {
    expect(() => validateProxyRequest({ system: 's' })).toThrow('userMessage');
  });

  it('rejects maxTokens out of range', () => {
    expect(() =>
      validateProxyRequest({ system: 's', userMessage: 'm', maxTokens: 0 })
    ).toThrow('maxTokens');
    expect(() =>
      validateProxyRequest({ system: 's', userMessage: 'm', maxTokens: 20000 })
    ).toThrow('maxTokens');
  });

  it('rejects non-number maxTokens', () => {
    expect(() =>
      validateProxyRequest({ system: 's', userMessage: 'm', maxTokens: 'big' })
    ).toThrow('maxTokens');
  });

  it('accepts valid provider', () => {
    const req = validateProxyRequest({
      system: 's',
      userMessage: 'm',
      provider: 'openai',
    });
    expect(req.provider).toBe('openai');
  });

  it('accepts all valid providers', () => {
    for (const provider of VALID_PROVIDERS) {
      const req = validateProxyRequest({
        system: 's',
        userMessage: 'm',
        provider,
      });
      expect(req.provider).toBe(provider);
    }
  });

  it('defaults provider to undefined when not specified', () => {
    const req = validateProxyRequest({
      system: 's',
      userMessage: 'm',
    });
    expect(req.provider).toBeUndefined();
  });

  it('rejects invalid provider', () => {
    expect(() =>
      validateProxyRequest({ system: 's', userMessage: 'm', provider: 'llama' })
    ).toThrow('provider');
  });

  it('rejects non-string provider', () => {
    expect(() =>
      validateProxyRequest({ system: 's', userMessage: 'm', provider: 42 })
    ).toThrow('provider');
  });
});

describe('rate limiter logic', () => {
  it('allows requests under the limit', () => {
    const limiter = createRateLimiter(3, 60_000);
    expect(limiter.isRateLimited('1.2.3.4')).toBe(false);
    expect(limiter.isRateLimited('1.2.3.4')).toBe(false);
    expect(limiter.isRateLimited('1.2.3.4')).toBe(false);
  });

  it('blocks requests over the limit', () => {
    const limiter = createRateLimiter(2, 60_000);
    limiter.isRateLimited('1.2.3.4');
    limiter.isRateLimited('1.2.3.4');
    expect(limiter.isRateLimited('1.2.3.4')).toBe(true);
  });

  it('tracks IPs independently', () => {
    const limiter = createRateLimiter(1, 60_000);
    limiter.isRateLimited('1.1.1.1');
    expect(limiter.isRateLimited('1.1.1.1')).toBe(true);
    expect(limiter.isRateLimited('2.2.2.2')).toBe(false);
  });
});

describe('rate limit IP resolution', () => {
  it('uses remoteAddress when proxy trust is disabled', () => {
    expect(
      getRateLimitIp({
        trustProxy: false,
        forwardedFor: '198.51.100.8',
        remoteAddress: '203.0.113.4',
      })
    ).toBe('203.0.113.4');
  });

  it('uses the rightmost forwarded hop for a single trusted proxy', () => {
    expect(
      getRateLimitIp({
        trustProxy: true,
        forwardedFor: '203.0.113.200, 198.51.100.8',
        remoteAddress: '10.0.0.5',
        trustedProxyHops: 1,
      })
    ).toBe('198.51.100.8');
  });

  it('can select the client behind multiple trusted proxy hops', () => {
    expect(
      getRateLimitIp({
        trustProxy: true,
        forwardedFor: '198.51.100.8, 203.0.113.4',
        remoteAddress: '10.0.0.5',
        trustedProxyHops: 2,
      })
    ).toBe('198.51.100.8');
  });

  it('falls back to remoteAddress when the forwarded chain is shorter than configured', () => {
    expect(
      getRateLimitIp({
        trustProxy: true,
        forwardedFor: '198.51.100.8',
        remoteAddress: '10.0.0.5',
        trustedProxyHops: 2,
      })
    ).toBe('10.0.0.5');
  });
});

describe('provider error mapping', () => {
  it('maps 401 to actionable unauthorized guidance', () => {
    const err = createProviderHttpError('anthropic', 401);
    expect(err).toBeInstanceOf(ProxyHttpError);
    expect(err.status).toBe(401);
    expect(err.message).toContain('invalid or expired');
  });

  it('maps 429 to rate-limit guidance', () => {
    const err = createProviderHttpError('openai', 429);
    expect(err.status).toBe(429);
    expect(err.message).toContain('rate limit');
  });

  it('maps unknown statuses to safe fallback guidance', () => {
    const err = createProviderHttpError('gemini', 503);
    expect(err.status).toBe(503);
    expect(err.message).toContain('API request failed (503)');
  });
});
