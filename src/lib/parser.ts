import type { Flow } from "../types";
import { parseWithAI } from "./ai";
import { FLOW_PARSE_PROMPT, GROUP_PARSE_PROMPT } from "./prompts";
import { hydrateItems } from "./flow";

const MAX_INPUT_LENGTH = 500_000; // 500 KB of raw text

/** Try to salvage truncated JSON by finding the last closing bracket. */
function repairJson(raw: string): unknown {
  const clean = raw
    .replace(/```json|```/g, "")
    .trim()
    .replace(/(?<=:\s*"(?:[^"\\]|\\.)*)[\n\r]+(?=[^"]*")/g, "\\n")
    .replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(clean);
  } catch {
    const cut = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]")) + 1;
    if (cut > 1) return JSON.parse(clean.substring(0, cut));
    throw new Error("Could not parse AI response as JSON");
  }
}

/** Ensure a value is a safe string (not an object/array that could cause issues). */
function safeStr(val: unknown, fallback = ""): string {
  if (typeof val === "string") return val;
  if (val === null || val === undefined) return fallback;
  return String(val);
}

export async function parseFlow(rawText: string): Promise<Flow> {
  if (rawText.length > MAX_INPUT_LENGTH) {
    throw new Error(
      `Input too large (${(rawText.length / 1000).toFixed(0)} KB). Maximum is ${MAX_INPUT_LENGTH / 1000} KB.`,
    );
  }

  const text = await parseWithAI({
    system: FLOW_PARSE_PROMPT,
    userMessage: `Parse this QuickSuite Flow:\n\n${rawText}`,
    maxTokens: 8000,
  });

  const parsed = repairJson(text);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("AI returned invalid structure (expected object)");
  }

  const obj = parsed as Record<string, unknown>;

  return {
    title: safeStr(obj.title),
    description: safeStr(obj.description),
    status: obj.status === "Published" ? "Published" : "Draft",
    shared: Boolean(obj.shared),
    schedules: safeStr(obj.schedules),
    items: hydrateItems(
      Array.isArray(obj.items) ? obj.items : [],
    ),
  };
}

export interface GroupParseResult {
  runCondition: string;
  reasoningInstructions: string;
}

export async function parseGroupInstructions(
  rawText: string,
): Promise<GroupParseResult> {
  if (rawText.length > MAX_INPUT_LENGTH) {
    throw new Error("Input too large");
  }

  const text = await parseWithAI({
    system: GROUP_PARSE_PROMPT,
    userMessage: `Extract the reasoning group config from this raw text:\n\n${rawText}`,
    maxTokens: 1000,
  });

  const parsed = repairJson(text);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { runCondition: "Once", reasoningInstructions: rawText };
  }

  const obj = parsed as Record<string, unknown>;
  return {
    runCondition: safeStr(obj.runCondition, "Once"),
    reasoningInstructions: safeStr(obj.reasoningInstructions, rawText),
  };
}
