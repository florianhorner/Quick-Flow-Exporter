import { describe, it, expect } from "vitest";
import { createRateLimiter, validateProxyRequest } from "../proxy-utils";

describe("proxy request validation", () => {
  it("accepts valid request", () => {
    const req = validateProxyRequest({
      system: "You are a parser",
      userMessage: "Parse this",
      maxTokens: 2000,
    });
    expect(req.system).toBe("You are a parser");
    expect(req.maxTokens).toBe(2000);
  });

  it("defaults maxTokens to 4096", () => {
    const req = validateProxyRequest({
      system: "s",
      userMessage: "m",
    });
    expect(req.maxTokens).toBe(4096);
  });

  it("rejects null body", () => {
    expect(() => validateProxyRequest(null)).toThrow("JSON object");
  });

  it("rejects missing system", () => {
    expect(() => validateProxyRequest({ userMessage: "m" })).toThrow("system");
  });

  it("rejects empty system", () => {
    expect(() => validateProxyRequest({ system: "", userMessage: "m" })).toThrow("system");
  });

  it("rejects missing userMessage", () => {
    expect(() => validateProxyRequest({ system: "s" })).toThrow("userMessage");
  });

  it("rejects maxTokens out of range", () => {
    expect(() =>
      validateProxyRequest({ system: "s", userMessage: "m", maxTokens: 0 }),
    ).toThrow("maxTokens");
    expect(() =>
      validateProxyRequest({ system: "s", userMessage: "m", maxTokens: 20000 }),
    ).toThrow("maxTokens");
  });

  it("rejects non-number maxTokens", () => {
    expect(() =>
      validateProxyRequest({ system: "s", userMessage: "m", maxTokens: "big" }),
    ).toThrow("maxTokens");
  });
});

describe("rate limiter logic", () => {
  it("allows requests under the limit", () => {
    const limiter = createRateLimiter(3, 60_000);
    expect(limiter.isRateLimited("1.2.3.4")).toBe(false);
    expect(limiter.isRateLimited("1.2.3.4")).toBe(false);
    expect(limiter.isRateLimited("1.2.3.4")).toBe(false);
  });

  it("blocks requests over the limit", () => {
    const limiter = createRateLimiter(2, 60_000);
    limiter.isRateLimited("1.2.3.4");
    limiter.isRateLimited("1.2.3.4");
    expect(limiter.isRateLimited("1.2.3.4")).toBe(true);
  });

  it("tracks IPs independently", () => {
    const limiter = createRateLimiter(1, 60_000);
    limiter.isRateLimited("1.1.1.1");
    expect(limiter.isRateLimited("1.1.1.1")).toBe(true);
    expect(limiter.isRateLimited("2.2.2.2")).toBe(false);
  });
});
