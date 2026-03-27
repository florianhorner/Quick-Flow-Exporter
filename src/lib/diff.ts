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

  // Match items by title (best-effort), falling back to position for untitled items
  const leftItems = left.items;
  const rightItems = right.items;

  const leftMap = new Map(leftItems.map((it, i) => [itemKey(it, i), it]));
  const rightMap = new Map(rightItems.map((it, i) => [itemKey(it, i), it]));

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
  // Diff child steps
  const leftChildMap = new Map(lg.steps.map((s) => [s.title.toLowerCase(), s]));
  const rightChildMap = new Map(rg.steps.map((s) => [s.title.toLowerCase(), s]));

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

function itemKey(item: FlowItem, index: number): string {
  const title = item.isGroup ? item.title : (item as Step).title;
  return title ? title.toLowerCase() : `__pos_${index}`;
}

function itemSummary(item: FlowItem): string {
  if (item.isGroup) {
    return `Group "${item.title}" (${item.steps.length} steps, ${item.runCondition})`;
  }
  const s = item as Step;
  return `${s.type}: "${s.title}" — ${s.prompt.slice(0, 100)}${s.prompt.length > 100 ? "…" : ""}`;
}

/** Produce word-level HTML diff between two strings. */
export function wordDiffHtml(left: string, right: string): string {
  const diffs = dmp.diff_main(left, right);
  dmp.diff_cleanupSemantic(diffs);
  return diffs
    .map(([op, text]) => {
      const escaped = escapeHtml(text);
      if (op === -1) return `<span class="bg-red-200 text-red-900 line-through">${escaped}</span>`;
      if (op === 1) return `<span class="bg-green-200 text-green-900">${escaped}</span>`;
      return escaped;
    })
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
