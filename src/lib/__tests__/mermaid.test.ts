import { describe, it, expect } from "vitest";
import { generateMermaid } from "../mermaid";
import { createEmptyFlow, createEmptyStep, createEmptyGroup } from "../flow";

describe("generateMermaid", () => {
  it("starts with flowchart TD", () => {
    const flow = createEmptyFlow();
    const mermaid = generateMermaid(flow);
    expect(mermaid).toMatch(/^flowchart TD/);
  });

  it("renders a single step node", () => {
    const flow = createEmptyFlow();
    const step = createEmptyStep("chat_agent");
    step.title = "Ask Agent";
    flow.items = [step];

    const mermaid = generateMermaid(flow);
    expect(mermaid).toContain('S0["🤖 Ask Agent"]');
  });

  it("renders sequential step connections", () => {
    const flow = createEmptyFlow();
    const s1 = createEmptyStep("general_knowledge");
    s1.title = "Step A";
    const s2 = createEmptyStep("web_search");
    s2.title = "Step B";
    flow.items = [s1, s2];

    const mermaid = generateMermaid(flow);
    expect(mermaid).toContain("S0 --> S1");
  });

  it("renders a group as a subgraph", () => {
    const flow = createEmptyFlow();
    const group = createEmptyGroup();
    group.title = "My Group";
    group.runCondition = "Validate";
    const child = createEmptyStep("web_search");
    child.title = "Search";
    group.steps = [child];
    flow.items = [group];

    const mermaid = generateMermaid(flow);
    expect(mermaid).toContain('subgraph G0["🔄 My Group"]');
    expect(mermaid).toContain('G0_cond{{"Validate"}}');
    expect(mermaid).toContain('G0_S0["🌐 Search"]');
    expect(mermaid).toContain("end");
  });

  it("connects group to following step", () => {
    const flow = createEmptyFlow();
    const group = createEmptyGroup();
    group.title = "G";
    const child = createEmptyStep();
    child.title = "C";
    group.steps = [child];
    const after = createEmptyStep();
    after.title = "After";
    flow.items = [group, after];

    const mermaid = generateMermaid(flow);
    expect(mermaid).toContain("G0_S0 --> S1");
  });

  it("renders @reference edges as dotted lines", () => {
    const flow = createEmptyFlow();
    const s1 = createEmptyStep();
    s1.title = "Source";
    const s2 = createEmptyStep();
    s2.title = "Target";
    s2.references = "@Source";
    flow.items = [s1, s2];

    const mermaid = generateMermaid(flow);
    expect(mermaid).toContain('S0 -.->|"@ref"| S1');
  });

  it("sanitizes special characters in titles", () => {
    const flow = createEmptyFlow();
    const step = createEmptyStep();
    step.title = 'Step [with] "quotes"';
    flow.items = [step];

    const mermaid = generateMermaid(flow);
    // Brackets and quotes should be stripped/replaced
    expect(mermaid).not.toContain("[with]");
    expect(mermaid).toContain("Step with 'quotes'");
  });

  it("includes class definitions for styling", () => {
    const flow = createEmptyFlow();
    const mermaid = generateMermaid(flow);
    expect(mermaid).toContain("classDef agent");
    expect(mermaid).toContain("classDef knowledge");
    expect(mermaid).toContain("classDef input");
    expect(mermaid).toContain("classDef group");
  });

  it("handles empty flow", () => {
    const flow = createEmptyFlow();
    const mermaid = generateMermaid(flow);
    expect(mermaid).toContain("flowchart TD");
    // Should not throw
  });
});
