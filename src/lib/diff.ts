import DiffMatchPatch from "diff-match-patch";
import type { Flow, FlowItem, Step, Group, DiffChange } from "../types";

const dmp = new DiffMatchPatch();

export interface FlowDiffResult {
  changes: DiffChange[];
  summary: { added: number; removed: number; modified: number };
}

/** Compare two flows and produce a list of changes. */
export function diffFlows(left: Flow, right: Flow): FlowDiffResult {
  const changes: DiffChange[] = [];

  // Metadata changes
  if (left.title !== right.title) {
    changes.push({ type: "modified", path: "title", label: "Flow Title", leftValue: left.title, rightValue: right.title });
  }
  if (left.description !== right.description) {
    changes.push({ type: "modified", path: "description", label: "Description", leftValue: left.description, rightValue: right.description });
  }
  if (left.status !== right.status) {
    changes.push({ type: "modified", path: "status", label: "Status", leftValue: left.status, rightValue: right.status });
  }
  if (left.shared !== right.shared) {
    changes.push({ type: "modified", path: "shared", label: "Shared", leftValue: String(left.shared), rightValue: String(right.shared) });
  }

  // Match items by title (best-effort), using occurrence index to handle duplicates
  const leftItems = left.items;
  const rightItems = right.items;

  const leftMap = new Map(buildKeyedItems(leftItems));
  const rightMap = new Map(buildKeyedItems(rightItems));

  // Removed items
  for (const [key, item] of leftMap) {
    if (!rightMap.has(key)) {
      changes.push({
        type: "removed",
        path: `items.${key}`,
        label: `${item.isGroup ? "Group" : "Step"}: ${item.isGroup ? item.title : (item as Step).title}`,
        leftValue: itemSummary(item),
      });
    }
  }

  // Added items
  for (const [key, item] of rightMap) {
    if (!leftMap.has(key)) {
      changes.push({
        type: "added",
        path: `items.${key}`,
        label: `${item.isGroup ? "Group" : "Step"}: ${item.isGroup ? item.title : (item as Step).title}`,
        rightValue: itemSummary(item),
      });
    }
  }

  // Modified items
  for (const [key, leftItem] of leftMap) {
    const rightItem = rightMap.get(key);
    if (!rightItem) continue;

    if (!leftItem.isGroup && !rightItem.isGroup) {
      const ls = leftItem as Step;
      const rs = rightItem as Step;
      diffStep(ls, rs, key, changes);
    } else if (leftItem.isGroup && rightItem.isGroup) {
      const lg = leftItem as Group;
      const rg = rightItem as Group;
      diffGroup(lg, rg, key, changes);
    }
  }

  const summary = {
    added: changes.filter((c) => c.type === "added").length,
    removed: changes.filter((c) => c.type === "removed").length,
    modified: changes.filter((c) => c.type === "modified").length,
  };

  return { changes, summary };
}

function diffStep(ls: Step, rs: Step, key: string, changes: DiffChange[]) {
  if (ls.type !== rs.type) {
    changes.push({ type: "modified", path: `${key}.type`, label: `${ls.title} → Type`, leftValue: ls.type, rightValue: rs.type });
  }
  if (ls.prompt !== rs.prompt) {
    changes.push({ type: "modified", path: `${key}.prompt`, label: `${ls.title} → Prompt`, leftValue: ls.prompt, rightValue: rs.prompt });
  }
  if (ls.source !== rs.source) {
    changes.push({ type: "modified", path: `${key}.source`, label: `${ls.title} → Source`, leftValue: ls.source, rightValue: rs.source });
  }
  if (ls.outputPref !== rs.outputPref) {
    changes.push({ type: "modified", path: `${key}.outputPref`, label: `${ls.title} → Output Pref`, leftValue: ls.outputPref, rightValue: rs.outputPref });
  }
  if (ls.creativityLevel !== rs.creativityLevel) {
    changes.push({ type: "modified", path: `${key}.creativity`, label: `${ls.title} → Creativity`, leftValue: String(ls.creativityLevel), rightValue: String(rs.creativityLevel) });
  }
  if (ls.agentName !== rs.agentName) {
    changes.push({ type: "modified", path: `${key}.agentName`, label: `${ls.title} → Agent Name`, leftValue: ls.agentName, rightValue: rs.agentName });
  }
  if (ls.references !== rs.references) {
    changes.push({ type: "modified", path: `${key}.references`, label: `${ls.title} → References`, leftValue: ls.references, rightValue: rs.references });
  }
}

function diffGroup(lg: Group, rg: Group, key: string, changes: DiffChange[]) {
  if (lg.runCondition !== rg.runCondition) {
    changes.push({ type: "modified", path: `${key}.runCondition`, label: `${lg.title} → Run Condition`, leftValue: lg.runCondition, rightValue: rg.runCondition });
  }
  if (lg.reasoningInstructions !== rg.reasoningInstructions) {
    changes.push({ type: "modified", path: `${key}.reasoning`, label: `${lg.title} → Reasoning`, leftValue: lg.reasoningInstructions, rightValue: rg.reasoningInstructions });
  }
  // Diff child steps (occurrence-aware to handle duplicate titles)
  const leftChildMap = new Map(buildKeyedSteps(lg.steps));
  const rightChildMap = new Map(buildKeyedSteps(rg.steps));

  for (const [childKey, step] of leftChildMap) {
    if (!rightChildMap.has(childKey)) {
      changes.push({ type: "removed", path: `${key}.steps.${childKey}`, label: `${lg.title} → Step: ${step.title}`, leftValue: step.prompt });
    }
  }
  for (const [childKey, step] of rightChildMap) {
    if (!leftChildMap.has(childKey)) {
      changes.push({ type: "added", path: `${key}.steps.${childKey}`, label: `${lg.title} → Step: ${step.title}`, rightValue: step.prompt });
    }
  }
  for (const [childKey, ls] of leftChildMap) {
    const rs = rightChildMap.get(childKey);
    if (rs) diffStep(ls, rs, `${key}.steps.${childKey}`, changes);
  }
}

/** Build a list of [key, item] pairs with occurrence-aware keys to handle duplicate titles. */
function buildKeyedItems(items: FlowItem[]): [string, FlowItem][] {
  const counts = new Map<string, number>();
  return items.map((item, index) => {
    const base = itemBaseKey(item, index);
    const occ = counts.get(base) ?? 0;
    counts.set(base, occ + 1);
    const key = occ === 0 ? base : `${base}__${occ}`;
    return [key, item];
  });
}

function itemBaseKey(item: FlowItem, index: number): string {
  const title = item.isGroup ? item.title : (item as Step).title;
  return title ? title.toLowerCase() : `__pos_${index}`;
}

function buildKeyedSteps(steps: Step[]): [string, Step][] {
  const counts = new Map<string, number>();
  return steps.map((step) => {
    const base = step.title ? step.title.toLowerCase() : `__unnamed`;
    const occ = counts.get(base) ?? 0;
    counts.set(base, occ + 1);
    const key = occ === 0 ? base : `${base}__${occ}`;
    return [key, step];
  });
}

function itemSummary(item: FlowItem): string {
  if (item.isGroup) {
    return `Group "${item.title}" (${item.steps.length} steps, ${item.runCondition})`;
  }
  const s = item as Step;
  return `${s.type}: "${s.title}" — ${s.prompt.slice(0, 100)}${s.prompt.length > 100 ? "…" : ""}`;
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
