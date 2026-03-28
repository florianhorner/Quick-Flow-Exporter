import DiffMatchPatch from "diff-match-patch";
import type { Flow, FlowItem, Step, Group, DiffChange } from "../types";

const dmp = new DiffMatchPatch();

const FLOW_METADATA_FIELDS = [
  {
    path: "title",
    label: "Flow Title",
    read: (flow: Flow) => flow.title,
  },
  {
    path: "description",
    label: "Description",
    read: (flow: Flow) => flow.description,
  },
  {
    path: "status",
    label: "Status",
    read: (flow: Flow) => flow.status,
  },
  {
    path: "shared",
    label: "Shared",
    read: (flow: Flow) => String(flow.shared),
  },
] as const;

const STEP_FIELDS = [
  { path: "type", label: "Type", read: (step: Step) => step.type },
  { path: "prompt", label: "Prompt", read: (step: Step) => step.prompt },
  { path: "source", label: "Source", read: (step: Step) => step.source },
  {
    path: "outputPref",
    label: "Output Pref",
    read: (step: Step) => step.outputPref,
  },
  {
    path: "creativity",
    label: "Creativity",
    read: (step: Step) => String(step.creativityLevel),
  },
  {
    path: "agentName",
    label: "Agent Name",
    read: (step: Step) => step.agentName,
  },
  {
    path: "references",
    label: "References",
    read: (step: Step) => step.references,
  },
] as const;

const GROUP_FIELDS = [
  {
    path: "runCondition",
    label: "Run Condition",
    read: (group: Group) => group.runCondition,
  },
  {
    path: "reasoning",
    label: "Reasoning",
    read: (group: Group) => group.reasoningInstructions,
  },
] as const;

export interface FlowDiffResult {
  changes: DiffChange[];
  summary: { added: number; removed: number; modified: number };
}

/** Compare two flows and produce a list of changes. */
export function diffFlows(left: Flow, right: Flow): FlowDiffResult {
  const changes: DiffChange[] = [];

  diffFlowMetadata(left, right, changes);

  const leftMap = new Map(buildKeyedItems(left.items));
  const rightMap = new Map(buildKeyedItems(right.items));

  for (const [key, item] of leftMap) {
    if (!rightMap.has(key)) {
      changes.push({
        type: "removed",
        path: `items.${key}`,
        label: `${item.isGroup ? "Group" : "Step"}: ${itemTitle(item)}`,
        leftValue: itemSummary(item),
      });
    }
  }

  for (const [key, item] of rightMap) {
    if (!leftMap.has(key)) {
      changes.push({
        type: "added",
        path: `items.${key}`,
        label: `${item.isGroup ? "Group" : "Step"}: ${itemTitle(item)}`,
        rightValue: itemSummary(item),
      });
    }
  }

  for (const [key, leftItem] of leftMap) {
    const rightItem = rightMap.get(key);
    if (!rightItem) {
      continue;
    }

    if (!leftItem.isGroup && !rightItem.isGroup) {
      diffStep(leftItem, rightItem, key, changes);
      continue;
    }

    if (leftItem.isGroup && rightItem.isGroup) {
      diffGroup(leftItem, rightItem, key, changes);
    }
  }

  return {
    changes,
    summary: summarizeChanges(changes),
  };
}

function diffFlowMetadata(left: Flow, right: Flow, changes: DiffChange[]): void {
  for (const field of FLOW_METADATA_FIELDS) {
    const leftValue = field.read(left);
    const rightValue = field.read(right);
    addModifiedChange(changes, field.path, field.label, leftValue, rightValue);
  }
}

function addModifiedChange(
  changes: DiffChange[],
  path: string,
  label: string,
  leftValue: string,
  rightValue: string,
): void {
  if (leftValue === rightValue) {
    return;
  }

  changes.push({
    type: "modified",
    path,
    label,
    leftValue,
    rightValue,
  });
}

function diffStep(left: Step, right: Step, key: string, changes: DiffChange[]): void {
  for (const field of STEP_FIELDS) {
    addModifiedChange(
      changes,
      `${key}.${field.path}`,
      `${left.title} → ${field.label}`,
      field.read(left),
      field.read(right),
    );
  }
}

function diffGroup(left: Group, right: Group, key: string, changes: DiffChange[]): void {
  for (const field of GROUP_FIELDS) {
    addModifiedChange(
      changes,
      `${key}.${field.path}`,
      `${left.title} → ${field.label}`,
      field.read(left),
      field.read(right),
    );
  }

  const leftChildMap = new Map(buildKeyedSteps(left.steps));
  const rightChildMap = new Map(buildKeyedSteps(right.steps));

  for (const [childKey, step] of leftChildMap) {
    if (!rightChildMap.has(childKey)) {
      changes.push({
        type: "removed",
        path: `${key}.steps.${childKey}`,
        label: `${left.title} → Step: ${step.title}`,
        leftValue: step.prompt,
      });
    }
  }

  for (const [childKey, step] of rightChildMap) {
    if (!leftChildMap.has(childKey)) {
      changes.push({
        type: "added",
        path: `${key}.steps.${childKey}`,
        label: `${left.title} → Step: ${step.title}`,
        rightValue: step.prompt,
      });
    }
  }

  for (const [childKey, leftChild] of leftChildMap) {
    const rightChild = rightChildMap.get(childKey);
    if (rightChild) {
      diffStep(leftChild, rightChild, `${key}.steps.${childKey}`, changes);
    }
  }
}

function summarizeChanges(changes: DiffChange[]): FlowDiffResult["summary"] {
  const summary = { added: 0, removed: 0, modified: 0 };

  for (const change of changes) {
    summary[change.type] += 1;
  }

  return summary;
}

/** Build a list of [key, item] pairs with occurrence-aware keys to handle duplicate titles. */
function buildKeyedItems(items: FlowItem[]): [string, FlowItem][] {
  return buildKeyedEntries(items, (item, index) => {
    const title = itemTitle(item);
    return title ? title.toLowerCase() : `__pos_${index}`;
  });
}

function buildKeyedSteps(steps: Step[]): [string, Step][] {
  return buildKeyedEntries(steps, (step) =>
    step.title ? step.title.toLowerCase() : "__unnamed",
  );
}

function buildKeyedEntries<T>(
  items: T[],
  baseKeyFor: (item: T, index: number) => string,
): [string, T][] {
  const counts = new Map<string, number>();

  return items.map((item, index) => {
    const base = baseKeyFor(item, index);
    const occurrence = counts.get(base) ?? 0;
    counts.set(base, occurrence + 1);
    const key = occurrence === 0 ? base : `${base}__${occurrence}`;
    return [key, item];
  });
}

function itemTitle(item: FlowItem): string {
  return item.isGroup ? item.title : item.title;
}

function itemSummary(item: FlowItem): string {
  if (item.isGroup) {
    return `Group "${item.title}" (${item.steps.length} steps, ${item.runCondition})`;
  }

  return `${item.type}: "${item.title}" — ${item.prompt.slice(0, 100)}${item.prompt.length > 100 ? "…" : ""}`;
}

export interface DiffSegment {
  op: "equal" | "insert" | "delete";
  text: string;
}

/** Produce word-level diff segments between two strings. */
export function wordDiffSegments(left: string, right: string): DiffSegment[] {
  const diffs = dmp.diff_main(left, right);
  dmp.diff_cleanupSemantic(diffs);

  return diffs.map(([op, text]) => ({
    op: op === -1 ? "delete" : op === 1 ? "insert" : "equal",
    text,
  }));
}
