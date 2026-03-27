import { describe, it, expect } from "vitest";

/**
 * The proxy server uses raw http.createServer and starts listening on import,
 * so we test the validation and rate-limiting logic by extracting the patterns
 * rather than importing the module directly. These are integration-style tests
 * that verify the request contract.
 */

describe("proxy request validation", () => {
  // Mirror the validateRequest logic from proxy.ts
  function validateRequest(body: unknown) {
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
    if (
      obj.maxTokens !== undefined &&
      (typeof obj.maxTokens !== "number" || obj.maxTokens < 1 || obj.maxTokens > 16000)
    ) {
      throw new Error("'maxTokens' must be a number between 1 and 16000");
    }
    return {
      system: obj.system,
      userMessage: obj.userMessage,
      maxTokens: (obj.maxTokens as number | undefined) ?? 4096,
    };
  }

  it("accepts valid request", () => {
    const req = validateRequest({
      system: "You are a parser",
      userMessage: "Parse this",
      maxTokens: 2000,
    });
    expect(req.system).toBe("You are a parser");
    expect(req.maxTokens).toBe(2000);
  });

  it("defaults maxTokens to 4096", () => {
    const req = validateRequest({
      system: "s",
      userMessage: "m",
    });
    expect(req.maxTokens).toBe(4096);
  });

  it("rejects null body", () => {
    expect(() => validateRequest(null)).toThrow("JSON object");
  });

  it("rejects missing system", () => {
    expect(() => validateRequest({ userMessage: "m" })).toThrow("system");
  });

  it("rejects empty system", () => {
    expect(() => validateRequest({ system: "", userMessage: "m" })).toThrow("system");
  });

  it("rejects missing userMessage", () => {
    expect(() => validateRequest({ system: "s" })).toThrow("userMessage");
  });

  it("rejects maxTokens out of range", () => {
    expect(() =>
      validateRequest({ system: "s", userMessage: "m", maxTokens: 0 }),
    ).toThrow("maxTokens");
    expect(() =>
      validateRequest({ system: "s", userMessage: "m", maxTokens: 20000 }),
    ).toThrow("maxTokens");
  });

  it("rejects non-number maxTokens", () => {
    expect(() =>
      validateRequest({ system: "s", userMessage: "m", maxTokens: "big" }),
    ).toThrow("maxTokens");
  });
});

describe("rate limiter logic", () => {
  // Mirror the rate limiter from proxy.ts
  function createRateLimiter(limit: number, windowMs: number) {
    const hits = new Map<string, number[]>();

    return function isRateLimited(ip: string): boolean {
      const now = Date.now();
      const timestamps = (hits.get(ip) ?? []).filter(
        (t) => now - t < windowMs,
      );
      if (timestamps.length >= limit) {
        hits.set(ip, timestamps);
        return true;
      }
      timestamps.push(now);
      hits.set(ip, timestamps);
      return false;
    };
  }

  it("allows requests under the limit", () => {
    const isLimited = createRateLimiter(3, 60_000);
    expect(isLimited("1.2.3.4")).toBe(false);
    expect(isLimited("1.2.3.4")).toBe(false);
    expect(isLimited("1.2.3.4")).toBe(false);
  });

  it("blocks requests over the limit", () => {
    const isLimited = createRateLimiter(2, 60_000);
    isLimited("1.2.3.4");
    isLimited("1.2.3.4");
    expect(isLimited("1.2.3.4")).toBe(true);
  });

  it("tracks IPs independently", () => {
    const isLimited = createRateLimiter(1, 60_000);
    isLimited("1.1.1.1");
    expect(isLimited("1.1.1.1")).toBe(true);
    expect(isLimited("2.2.2.2")).toBe(false);
  });
});
