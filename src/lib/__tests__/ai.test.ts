import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseWithAI } from "../ai";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("parseWithAI", () => {
  it("sends correct request and returns text", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ text: "parsed result" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await parseWithAI({
      system: "You are a parser",
      userMessage: "Parse this",
      maxTokens: 2000,
    });

    expect(result).toBe("parsed result");
    expect(mockFetch).toHaveBeenCalledWith("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: "You are a parser",
        userMessage: "Parse this",
        maxTokens: 2000,
      }),
      signal: expect.any(AbortSignal),
    });
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal error"),
      }),
    );

    await expect(
      parseWithAI({ system: "s", userMessage: "m" }),
    ).rejects.toThrow("AI proxy returned 500: Internal error");
  });

  it("throws on unexpected response shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: "wrong shape" }),
      }),
    );

    await expect(
      parseWithAI({ system: "s", userMessage: "m" }),
    ).rejects.toThrow("Unexpected response shape");
  });

  it("defaults maxTokens to 4096", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ text: "ok" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await parseWithAI({ system: "s", userMessage: "m" });

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.maxTokens).toBe(4096);
  });
});
