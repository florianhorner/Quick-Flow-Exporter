import { describe, it, expect } from "vitest";
import {
  createEmptyStep,
  createEmptyGroup,
  createEmptyFlow,
  hydrateItems,
  allSteps,
  allGroups,
} from "../flow";

describe("createEmptyStep", () => {
  it("returns a step with a UUID id", () => {
    const step = createEmptyStep();
    expect(step.id).toBeTruthy();
    expect(step.type).toBe("general_knowledge");
    expect(step.isGroup).toBeUndefined();
  });

  it("accepts a custom type", () => {
    const step = createEmptyStep("chat_agent");
    expect(step.type).toBe("chat_agent");
  });

  it("generates unique ids", () => {
    const a = createEmptyStep();
    const b = createEmptyStep();
    expect(a.id).not.toBe(b.id);
  });
});

describe("createEmptyGroup", () => {
  it("returns a group with isGroup true", () => {
    const group = createEmptyGroup();
    expect(group.isGroup).toBe(true);
    expect(group.steps).toEqual([]);
    expect(group.runCondition).toBe("Once");
  });
});

describe("createEmptyFlow", () => {
  it("returns a flow with empty items", () => {
    const flow = createEmptyFlow();
    expect(flow.title).toBe("");
    expect(flow.status).toBe("Draft");
    expect(flow.items).toEqual([]);
  });
});

describe("hydrateItems", () => {
  it("hydrates partial steps with defaults", () => {
    const items = hydrateItems([
      { title: "My Step", prompt: "Do something" },
    ]);
    expect(items).toHaveLength(1);
    const step = items[0]!;
    expect(step.isGroup).toBeUndefined();
    expect((step as any).title).toBe("My Step");
    expect((step as any).source).toBe("General knowledge");
    expect((step as any).id).toBeTruthy();
  });

  it("hydrates groups and their child steps", () => {
    const items = hydrateItems([
      {
        isGroup: true,
        title: "My Group",
        steps: [{ title: "Child", type: "web_search" } as any],
      } as any,
    ]);
    expect(items).toHaveLength(1);
    const group = items[0]! as any;
    expect(group.isGroup).toBe(true);
    expect(group.steps).toHaveLength(1);
    expect(group.steps[0].type).toBe("web_search");
    expect(group.steps[0].id).toBeTruthy();
  });

  it("assigns fresh UUIDs to all items", () => {
    const items = hydrateItems([
      { title: "A" },
      { isGroup: true, title: "G", steps: [{ title: "B" }] } as any,
    ]);
    const ids = [
      (items[0] as any).id,
      (items[1] as any).id,
      (items[1] as any).steps[0].id,
    ];
    expect(new Set(ids).size).toBe(3);
  });

  it("handles empty array", () => {
    expect(hydrateItems([])).toEqual([]);
  });
});

describe("allSteps", () => {
  it("collects steps from top-level and groups", () => {
    const step1 = createEmptyStep();
    const step2 = createEmptyStep("chat_agent");
    const group = { ...createEmptyGroup(), steps: [step2] };
    const steps = allSteps([step1, group]);
    expect(steps).toHaveLength(2);
    expect(steps).toContain(step1);
    expect(steps).toContain(step2);
  });

  it("returns empty for empty items", () => {
    expect(allSteps([])).toEqual([]);
  });
});

describe("allGroups", () => {
  it("filters only groups", () => {
    const step = createEmptyStep();
    const group = createEmptyGroup();
    const groups = allGroups([step, group]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toBe(group);
  });
});
