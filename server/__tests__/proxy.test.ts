import { describe, it, expect } from 'vitest';
import {
  createRateLimiter,
  extractTrustedIp,
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
    expect(limiter.isRateLimited('1.2.3.4')).toBe(false);
    expect(limiter.isRateLimited('1.2.3.4')).toBe(false);
    expect(limiter.isRateLimited('1.2.3.4')).toBe(true);
  });

  it('tracks IPs independently', () => {
    const limiter = createRateLimiter(1, 60_000);
    limiter.isRateLimited('1.1.1.1');
    expect(limiter.isRateLimited('1.1.1.1')).toBe(true);
    expect(limiter.isRateLimited('2.2.2.2')).toBe(false);
  });
});

describe('extractTrustedIp', () => {
  // Regression: ISSUE-001 — rate-limit bypass via forged X-Forwarded-For
  // Found by /qa on 2026-04-14
  // Report: .gstack/qa-reports/qa-report-localhost-2026-04-14.md
  //
  // Bug: the server was reading split(',')[0] (client-controlled first segment).
  // An attacker could send "attacker-ip, real-proxy-ip" and get a fresh rate-limit
  // bucket each request by rotating the first segment.
  // Fix: use the last segment — that's the one the trusted proxy appended.

  it('returns the LAST segment of X-Forwarded-For, not the first', () => {
    // client sends "fake-ip, real-ip" — must use real-ip (last, proxy-appended)
    expect(extractTrustedIp('1.1.1.1, 2.2.2.2, 3.3.3.3', '4.4.4.4')).toBe('3.3.3.3');
  });

  it('with a single IP returns that IP', () => {
    expect(extractTrustedIp('5.5.5.5', '6.6.6.6')).toBe('5.5.5.5');
  });

  it('trims whitespace from the IP segments', () => {
    expect(extractTrustedIp('  1.1.1.1  ,  2.2.2.2  ', '9.9.9.9')).toBe('2.2.2.2');
  });

  it('falls back to socket address when header is undefined', () => {
    expect(extractTrustedIp(undefined, '7.7.7.7')).toBe('7.7.7.7');
  });

  it('falls back to "unknown" when both header and socket are absent', () => {
    expect(extractTrustedIp(undefined, undefined)).toBe('unknown');
  });

  it('handles empty header string by falling back to socket address', () => {
    expect(extractTrustedIp('', '8.8.8.8')).toBe('8.8.8.8');
  });

  it('handles whitespace-only header by falling back to socket address', () => {
    expect(extractTrustedIp('   ', '8.8.8.8')).toBe('8.8.8.8');
  });
});
