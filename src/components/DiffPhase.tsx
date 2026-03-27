import { useState, useMemo, useCallback, useEffect } from "react";
import type { Flow } from "../types";
import { parseFlow } from "../lib/parser";
import { diffFlows, wordDiffHtml, type FlowDiffResult } from "../lib/diff";

interface DiffPhaseProps {
  currentFlow: Flow | null;
  onBack: () => void;
}

type DiffState = "input" | "result";

export default function DiffPhase({ currentFlow, onBack }: DiffPhaseProps) {
  const [leftRaw, setLeftRaw] = useState("");
  const [rightRaw, setRightRaw] = useState("");
  const [leftFlow, setLeftFlow] = useState<Flow | null>(currentFlow);
  const [rightFlow, setRightFlow] = useState<Flow | null>(null);
  const [state, setState] = useState<DiffState>("input");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Sync leftFlow when currentFlow prop changes (e.g. user re-parses)
  useEffect(() => {
    if (state === "input") {
      setLeftFlow(currentFlow);
    }
  }, [currentFlow, state]);

  const handleDiff = useCallback(async () => {
    setParsing(true);
    setError(null);
    try {
      const left = currentFlow ?? await parseFlow(leftRaw);
      const right = await parseFlow(rightRaw);
      setLeftFlow(left);
      setRightFlow(right);
      setState("result");
    } catch (e) {
      setError(`Parse error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setParsing(false);
  }, [leftRaw, rightRaw, currentFlow]);

  const diffResult = useMemo<FlowDiffResult | null>(() => {
    if (!leftFlow || !rightFlow) return null;
    return diffFlows(leftFlow, rightFlow);
  }, [leftFlow, rightFlow]);

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (state === "input") {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-4xl">🔍</div>
            <h2 className="text-xl font-bold">Flow Diff</h2>
            <p className="text-gray-500 text-sm">
              Compare two versions of a flow to see what changed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-red-600">◀ Before</span>
                {currentFlow && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Using current flow: {currentFlow.title}
                  </span>
                )}
              </div>
              {!currentFlow && (
                <textarea
                  className="w-full border-2 border-dashed border-red-200 rounded-lg px-3 py-2 text-sm font-mono bg-red-50/30 focus:border-red-400 transition-colors"
                  rows={10}
                  placeholder="Paste the BEFORE version of the flow here..."
                  value={leftRaw}
                  onChange={(e) => setLeftRaw(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <span className="text-sm font-semibold text-green-600">After ▶</span>
              <textarea
                className="w-full border-2 border-dashed border-green-200 rounded-lg px-3 py-2 text-sm font-mono bg-green-50/30 focus:border-green-400 transition-colors"
                rows={10}
                placeholder="Paste the AFTER version of the flow here..."
                value={rightRaw}
                onChange={(e) => setRightRaw(e.target.value)}
                autoFocus={!!currentFlow}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
            <button
              onClick={handleDiff}
              disabled={parsing || (!currentFlow && !leftRaw.trim()) || !rightRaw.trim()}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                parsing ? "bg-gray-300 text-gray-500" : "bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
              }`}
            >
              {parsing ? "⏳ Parsing..." : "🔍 Compare Flows"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}
        </div>
      </div>
    );
  }

  // Result view
  if (!diffResult) return null;
  const { changes, summary } = diffResult;
  const noChanges = changes.length === 0;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          <div>
            <div className="font-semibold text-sm">
              {leftFlow?.title || "(Untitled)"} → {rightFlow?.title || "(Untitled)"}
            </div>
            <div className="text-xs text-gray-500">
              {noChanges
                ? "No changes detected"
                : `${changes.length} change${changes.length > 1 ? "s" : ""}`}
            </div>
          </div>
        </div>
        <div className="flex gap-3 text-xs">
          {summary.added > 0 && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
              +{summary.added} added
            </span>
          )}
          {summary.removed > 0 && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
              −{summary.removed} removed
            </span>
          )}
          {summary.modified > 0 && (
            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
              ~{summary.modified} modified
            </span>
          )}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setState("input"); setRightFlow(null); setRightRaw(""); }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ↻ New Diff
        </button>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
      </div>

      {noChanges ? (
        <div className="bg-green-50 rounded-xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-2">✅</div>
          <div className="font-semibold text-green-800">Flows are identical</div>
          <div className="text-sm text-green-600 mt-1">No differences found between the two versions.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {changes.map((change) => {
            const expanded = expandedPaths.has(change.path);
            const isPromptChange = change.path.endsWith(".prompt") || change.path.endsWith(".reasoning");
            const hasLongContent = (change.leftValue?.length ?? 0) > 80 || (change.rightValue?.length ?? 0) > 80;

            return (
              <div
                key={change.path}
                className={`bg-white rounded-lg shadow-sm border-l-4 ${
                  change.type === "added" ? "border-green-500" :
                  change.type === "removed" ? "border-red-500" :
                  "border-amber-500"
                }`}
              >
                <div
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(change.path)}
                >
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    change.type === "added" ? "bg-green-100 text-green-800" :
                    change.type === "removed" ? "bg-red-100 text-red-800" :
                    "bg-amber-100 text-amber-800"
                  }`}>
                    {change.type === "added" ? "+" : change.type === "removed" ? "−" : "~"}
                  </span>
                  <span className="text-sm font-medium text-gray-800 flex-1">{change.label}</span>
                  {(isPromptChange || hasLongContent) && (
                    <span className="text-xs text-gray-400">{expanded ? "▾" : "▸"}</span>
                  )}
                </div>

                {/* Inline preview for short values */}
                {!isPromptChange && !hasLongContent && change.type === "modified" && (
                  <div className="px-4 pb-3 flex items-center gap-2 text-sm">
                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded line-through">{change.leftValue}</span>
                    <span className="text-gray-400">→</span>
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">{change.rightValue}</span>
                  </div>
                )}

                {/* Expanded word-level diff for prompts */}
                {expanded && change.type === "modified" && change.leftValue && change.rightValue && (
                  <div className="px-4 pb-3">
                    <div
                      className="text-sm font-mono bg-gray-50 rounded-lg p-3 border whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: wordDiffHtml(change.leftValue, change.rightValue) }}
                    />
                  </div>
                )}

                {/* Expanded content for added/removed */}
                {expanded && change.type !== "modified" && (
                  <div className="px-4 pb-3">
                    <pre className={`text-sm font-mono rounded-lg p-3 border whitespace-pre-wrap ${
                      change.type === "added" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    }`}>
                      {change.rightValue ?? change.leftValue}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
