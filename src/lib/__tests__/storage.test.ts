import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadHistory, saveHistory } from "../storage";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadHistory", () => {
  it("returns empty array when nothing stored", async () => {
    const result = await loadHistory();
    expect(result).toEqual([]);
  });

  it("loads valid history from localStorage", async () => {
    const entries = [
      { title: "Flow A", date: "2025-01-01T00:00:00Z", stepCount: 3 },
    ];
    localStorage.setItem("qs-export-history", JSON.stringify(entries));
    const result = await loadHistory();
    expect(result).toEqual(entries);
  });

  it("filters out invalid entries", async () => {
    const data = [
      { title: "Valid", date: "2025-01-01", stepCount: 2 },
      { title: 123, date: "bad", stepCount: "nope" }, // invalid
      null,
      "string",
    ];
    localStorage.setItem("qs-export-history", JSON.stringify(data));
    const result = await loadHistory();
    expect(result).toHaveLength(1);
    expect(result[0]!.title).toBe("Valid");
  });

  it("returns empty for corrupted JSON", async () => {
    localStorage.setItem("qs-export-history", "not json{{{");
    const result = await loadHistory();
    expect(result).toEqual([]);
  });

  it("returns empty when localStorage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    const result = await loadHistory();
    expect(result).toEqual([]);
  });
});

describe("saveHistory", () => {
  it("persists entries to localStorage", async () => {
    const entries = [
      { title: "Flow B", date: "2025-06-01T00:00:00Z", stepCount: 5 },
    ];
    await saveHistory(entries);
    const stored = JSON.parse(localStorage.getItem("qs-export-history")!);
    expect(stored).toEqual(entries);
  });

  it("caps at 50 entries", async () => {
    const entries = Array.from({ length: 60 }, (_, i) => ({
      title: `Flow ${i}`,
      date: "2025-01-01",
      stepCount: i,
    }));
    await saveHistory(entries);
    const stored = JSON.parse(localStorage.getItem("qs-export-history")!);
    expect(stored).toHaveLength(50);
  });

  it("strips invalid entries before saving", async () => {
    const entries = [
      { title: "Good", date: "2025-01-01", stepCount: 1 },
      { title: 999, date: null, stepCount: "bad" } as any,
    ];
    await saveHistory(entries);
    const stored = JSON.parse(localStorage.getItem("qs-export-history")!);
    expect(stored).toHaveLength(1);
  });

  it("does not throw when localStorage is full", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    // Should not throw
    await saveHistory([{ title: "X", date: "2025-01-01", stepCount: 1 }]);
  });
});
