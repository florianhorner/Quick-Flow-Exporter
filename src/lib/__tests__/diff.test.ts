import { describe, it, expect } from "vitest";
import { diffFlows, wordDiffSegments } from "../diff";
import { createEmptyFlow, createEmptyStep, createEmptyGroup } from "../flow";

describe("diffFlows", () => {
  it("returns no changes for identical flows", () => {
    const flow = createEmptyFlow();
    flow.title = "Same";
    const result = diffFlows(flow, { ...flow });
    expect(result.changes).toHaveLength(0);
    expect(result.summary).toEqual({ added: 0, removed: 0, modified: 0 });
  });

  it("detects title change", () => {
    const left = { ...createEmptyFlow(), title: "Old" };
    const right = { ...createEmptyFlow(), title: "New" };
    const result = diffFlows(left, right);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]!.type).toBe("modified");
    expect(result.changes[0]!.label).toBe("Flow Title");
    expect(result.changes[0]!.leftValue).toBe("Old");
    expect(result.changes[0]!.rightValue).toBe("New");
  });

  it("detects description change", () => {
    const left = { ...createEmptyFlow(), description: "A" };
    const right = { ...createEmptyFlow(), description: "B" };
    const result = diffFlows(left, right);
    expect(result.changes.some((c) => c.label === "Description")).toBe(true);
  });

  it("detects status change", () => {
    const left = { ...createEmptyFlow(), status: "Draft" as const };
    const right = { ...createEmptyFlow(), status: "Published" as const };
    const result = diffFlows(left, right);
    expect(result.changes.some((c) => c.label === "Status")).toBe(true);
  });

  it("detects added step", () => {
    const left = createEmptyFlow();
    const right = createEmptyFlow();
    const step = createEmptyStep();
    step.title = "New Step";
    right.items = [step];

    const result = diffFlows(left, right);
    expect(result.summary.added).toBe(1);
    expect(result.changes[0]!.type).toBe("added");
  });

  it("detects removed step", () => {
    const left = createEmptyFlow();
    const step = createEmptyStep();
    step.title = "Old Step";
    left.items = [step];
    const right = createEmptyFlow();

    const result = diffFlows(left, right);
    expect(result.summary.removed).toBe(1);
    expect(result.changes[0]!.type).toBe("removed");
  });

  it("detects modified step prompt", () => {
    const left = createEmptyFlow();
    const stepL = createEmptyStep();
    stepL.title = "Step";
    stepL.prompt = "Old prompt";
    left.items = [stepL];

    const right = createEmptyFlow();
    const stepR = createEmptyStep();
    stepR.title = "Step";
    stepR.prompt = "New prompt";
    right.items = [stepR];

    const result = diffFlows(left, right);
    expect(result.summary.modified).toBeGreaterThanOrEqual(1);
    expect(result.changes.some((c) => c.path.includes("prompt"))).toBe(true);
  });

  it("detects modified step type", () => {
    const left = createEmptyFlow();
    const stepL = createEmptyStep("general_knowledge");
    stepL.title = "Step";
    left.items = [stepL];

    const right = createEmptyFlow();
    const stepR = createEmptyStep("web_search");
    stepR.title = "Step";
    right.items = [stepR];

    const result = diffFlows(left, right);
    expect(result.changes.some((c) => c.path.includes("type"))).toBe(true);
  });

  it("detects group run condition change", () => {
    const left = createEmptyFlow();
    const gL = createEmptyGroup();
    gL.title = "Group";
    gL.runCondition = "Once";
    left.items = [gL];

    const right = createEmptyFlow();
    const gR = createEmptyGroup();
    gR.title = "Group";
    gR.runCondition = "Validate";
    right.items = [gR];

    const result = diffFlows(left, right);
    expect(result.changes.some((c) => c.path.includes("runCondition"))).toBe(true);
  });

  it("detects added/removed steps inside groups", () => {
    const left = createEmptyFlow();
    const gL = createEmptyGroup();
    gL.title = "Group";
    const childL = createEmptyStep();
    childL.title = "Child A";
    gL.steps = [childL];
    left.items = [gL];

    const right = createEmptyFlow();
    const gR = createEmptyGroup();
    gR.title = "Group";
    const childR = createEmptyStep();
    childR.title = "Child B";
    gR.steps = [childR];
    right.items = [gR];

    const result = diffFlows(left, right);
    expect(result.summary.added).toBeGreaterThanOrEqual(1);
    expect(result.summary.removed).toBeGreaterThanOrEqual(1);
  });

  it("handles shared flag change", () => {
    const left = { ...createEmptyFlow(), shared: false };
    const right = { ...createEmptyFlow(), shared: true };
    const result = diffFlows(left, right);
    expect(result.changes.some((c) => c.label === "Shared")).toBe(true);
  });

  it("handles duplicate step titles without dropping steps", () => {
    const left = createEmptyFlow();
    const stepA1 = createEmptyStep();
    stepA1.title = "Analyze Data";
    stepA1.prompt = "First analysis";
    const stepA2 = createEmptyStep();
    stepA2.title = "Analyze Data";
    stepA2.prompt = "Second analysis";
    left.items = [stepA1, stepA2];

    const right = createEmptyFlow();
    const stepB1 = createEmptyStep();
    stepB1.title = "Analyze Data";
    stepB1.prompt = "First analysis modified";
    const stepB2 = createEmptyStep();
    stepB2.title = "Analyze Data";
    stepB2.prompt = "Second analysis";
    right.items = [stepB1, stepB2];

    const result = diffFlows(left, right);
    // Should detect the modified prompt on the first "Analyze Data", not drop it
    expect(result.summary.modified).toBeGreaterThanOrEqual(1);
    expect(result.summary.removed).toBe(0);
    expect(result.summary.added).toBe(0);
  });
});

describe("wordDiffSegments", () => {
  it("returns equal segments for identical strings", () => {
    const segments = wordDiffSegments("hello world", "hello world");
    expect(segments).toHaveLength(1);
    expect(segments[0]!.op).toBe("equal");
    expect(segments[0]!.text).toBe("hello world");
  });

  it("marks additions as insert", () => {
    const segments = wordDiffSegments("hello", "hello world");
    expect(segments.some((s) => s.op === "insert" && s.text.includes("world"))).toBe(true);
  });

  it("marks removals as delete", () => {
    const segments = wordDiffSegments("hello world", "hello");
    expect(segments.some((s) => s.op === "delete")).toBe(true);
  });

  it("returns raw text segments without HTML escaping", () => {
    // Input contains HTML-like characters
    const segments = wordDiffSegments("<div>old</div>", "<div>new</div>");
    // Segments should contain the raw text — no HTML entity encoding
    // (React will handle escaping when rendering these as text nodes)
    const allText = segments.map((s) => s.text).join("");
    expect(allText).toContain("<div>");
    expect(allText).not.toContain("&lt;"); // no HTML escaping in segments
    segments.forEach((s) => expect(["equal", "insert", "delete"]).toContain(s.op));
  });
});
