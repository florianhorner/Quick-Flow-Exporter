import { describe, it, expect, vi, afterEach } from "vitest";
import type { Step } from "../../types";
import { parseFlow, parseGroupInstructions } from "../parser";

// Mock the AI module so tests don't hit a real API
vi.mock("../ai", () => ({
  parseWithAI: vi.fn(),
}));

import { parseWithAI } from "../ai";
const mockParseWithAI = vi.mocked(parseWithAI);

afterEach(() => {
  vi.clearAllMocks();
});

describe("parseFlow", () => {
  it("parses a valid AI response into a Flow", async () => {
    mockParseWithAI.mockResolvedValue(
      JSON.stringify({
        title: "My Flow",
        description: "A test flow",
        status: "Published",
        shared: true,
        schedules: "Daily",
        items: [
          {
            isGroup: false,
            type: "general_knowledge",
            title: "Step 1",
            prompt: "Do something",
          },
        ],
      }),
    );

    const flow = await parseFlow("raw text input");
    expect(flow.title).toBe("My Flow");
    expect(flow.description).toBe("A test flow");
    expect(flow.status).toBe("Published");
    expect(flow.shared).toBe(true);
    expect(flow.items).toHaveLength(1);
    expect((flow.items[0] as Step).title).toBe("Step 1");
  });

  it("handles AI response wrapped in markdown code fences", async () => {
    mockParseWithAI.mockResolvedValue(
      '```json\n{"title":"Fenced","description":"","status":"Draft","shared":false,"schedules":"","items":[]}\n```',
    );

    const flow = await parseFlow("raw");
    expect(flow.title).toBe("Fenced");
  });

  it("defaults status to Draft for unknown values", async () => {
    mockParseWithAI.mockResolvedValue(
      JSON.stringify({ title: "X", status: "Unknown", items: [] }),
    );

    const flow = await parseFlow("raw");
    expect(flow.status).toBe("Draft");
  });

  it("throws on input exceeding max length", async () => {
    const huge = "x".repeat(500_001);
    await expect(parseFlow(huge)).rejects.toThrow("Input too large");
  });

  it("throws when AI returns an array instead of object", async () => {
    mockParseWithAI.mockResolvedValue("[]");
    await expect(parseFlow("raw")).rejects.toThrow("invalid structure");
  });

  it("handles items not being an array", async () => {
    mockParseWithAI.mockResolvedValue(
      JSON.stringify({ title: "X", items: "not an array" }),
    );

    const flow = await parseFlow("raw");
    expect(flow.items).toEqual([]);
  });

  it("handles trailing commas in JSON", async () => {
    mockParseWithAI.mockResolvedValue(
      '{"title":"Trailing","items":[{"title":"S","type":"web_search",},],}',
    );

    const flow = await parseFlow("raw");
    expect(flow.title).toBe("Trailing");
  });
});

describe("parseGroupInstructions", () => {
  it("extracts run condition and instructions", async () => {
    mockParseWithAI.mockResolvedValue(
      JSON.stringify({
        runCondition: "Validate",
        reasoningInstructions: "Check score > 80",
      }),
    );

    const result = await parseGroupInstructions("raw group text");
    expect(result.runCondition).toBe("Validate");
    expect(result.reasoningInstructions).toBe("Check score > 80");
  });

  it("falls back to defaults on invalid AI response", async () => {
    mockParseWithAI.mockResolvedValue("[]");

    const result = await parseGroupInstructions("some text");
    expect(result.runCondition).toBe("Once");
    expect(result.reasoningInstructions).toBe("some text");
  });

  it("throws on oversized input", async () => {
    const huge = "x".repeat(500_001);
    await expect(parseGroupInstructions(huge)).rejects.toThrow("too large");
  });
});
