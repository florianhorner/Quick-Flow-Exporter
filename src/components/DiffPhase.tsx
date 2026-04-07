import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Flow } from '../types';
import { parseFlow } from '../lib/parser';
import { diffFlows, wordDiffSegments, type FlowDiffResult } from '../lib/diff';

interface DiffPhaseProps {
  currentFlow: Flow | null;
  onBack: () => void;
}

type DiffState = 'input' | 'result';

export default function DiffPhase({ currentFlow, onBack }: DiffPhaseProps) {
  const [leftRaw, setLeftRaw] = useState('');
  const [rightRaw, setRightRaw] = useState('');
  const [leftFlow, setLeftFlow] = useState<Flow | null>(currentFlow);
  const [rightFlow, setRightFlow] = useState<Flow | null>(null);
  const [state, setState] = useState<DiffState>('input');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Sync leftFlow when currentFlow prop changes (e.g. user re-parses)
  useEffect(() => {
    if (state === 'input') {
      setLeftFlow(currentFlow);
    }
  }, [currentFlow, state]);

  const handleDiff = useCallback(async () => {
    setParsing(true);
    setError(null);
    try {
      const left = currentFlow ?? (await parseFlow(leftRaw));
      const right = await parseFlow(rightRaw);
      setLeftFlow(left);
      setRightFlow(right);
      setState('result');
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

  if (state === 'input') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-midnight-800 border border-slate-200 dark:border-midnight-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              Compare flows
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Paste two versions of a flow to see what changed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-amber-500 dark:text-amber-400">
                  &laquo; Before
                </span>
                {currentFlow && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    ✓ Using current flow: {currentFlow.title}
                  </span>
                )}
              </div>
              {!currentFlow && (
                <textarea
                  className="w-full border border-amber-200 dark:border-amber-900/50 rounded-lg px-4 py-3 text-sm font-mono bg-slate-50 dark:bg-[#0d1117] text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                  rows={10}
                  placeholder="Paste the BEFORE version of the flow here..."
                  value={leftRaw}
                  onChange={(e) => setLeftRaw(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                After &raquo;
              </span>
              <textarea
                className="w-full border border-blue-200 dark:border-blue-900/50 rounded-lg px-4 py-3 text-sm font-mono bg-slate-50 dark:bg-[#0d1117] text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                rows={10}
                placeholder="Paste the AFTER version of the flow here..."
                value={rightRaw}
                onChange={(e) => setRightRaw(e.target.value)}
                autoFocus={!!currentFlow}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              &larr; Back
            </button>
            <button
              onClick={handleDiff}
              disabled={parsing || (!currentFlow && !leftRaw.trim()) || !rightRaw.trim()}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                parsing
                  ? 'bg-slate-200 dark:bg-midnight-700 text-slate-400 dark:text-slate-500'
                  : (!currentFlow && !leftRaw.trim()) || !rightRaw.trim()
                    ? 'bg-slate-200 dark:bg-midnight-700 text-slate-400 dark:text-slate-500'
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25'
              }`}
            >
              {parsing ? 'Parsing...' : 'Compare Flows'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
              ⚠ {error}
            </div>
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
      <div className="bg-white dark:bg-midnight-800 border border-slate-200 dark:border-midnight-700 rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
            DIFF
          </span>
          <div>
            <div className="font-semibold text-sm text-slate-900 dark:text-white">
              {leftFlow?.title || '(Untitled)'} &rarr; {rightFlow?.title || '(Untitled)'}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">
              {noChanges
                ? 'No changes detected'
                : `${changes.length} change${changes.length > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
        <div className="flex gap-3 text-xs">
          {summary.added > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-medium border border-blue-200 dark:border-blue-800">
              +{summary.added} added
            </span>
          )}
          {summary.removed > 0 && (
            <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-1 rounded-full font-medium border border-red-200 dark:border-red-800">
              &minus;{summary.removed} removed
            </span>
          )}
          {summary.modified > 0 && (
            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full font-medium border border-amber-200 dark:border-amber-800">
              ~{summary.modified} modified
            </span>
          )}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => {
            setState('input');
            setRightFlow(null);
            setRightRaw('');
          }}
          className="text-sm text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400"
        >
          &orarr; New Diff
        </button>
        <button
          onClick={onBack}
          className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          &larr; Back
        </button>
      </div>

      {noChanges ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm p-8 text-center">
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono mb-2">
            ✓ NO CHANGES
          </div>
          <div className="font-semibold text-blue-600 dark:text-blue-400">
            Flows are identical
          </div>
          <div className="text-sm text-blue-500 mt-1">
            No differences found between the two versions.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {changes.map((change) => {
            const expanded = expandedPaths.has(change.path);
            const isPromptChange =
              change.path.endsWith('.prompt') || change.path.endsWith('.reasoning');
            const hasLongContent =
              (change.leftValue?.length ?? 0) > 80 ||
              (change.rightValue?.length ?? 0) > 80;

            return (
              <div
                key={change.path}
                className={`bg-white dark:bg-midnight-800 rounded-lg shadow-sm border-l-4 border border-slate-200 dark:border-midnight-700 ${
                  change.type === 'added'
                    ? 'border-l-blue-500'
                    : change.type === 'removed'
                      ? 'border-l-red-500'
                      : 'border-l-amber-500'
                }`}
              >
                <div
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-midnight-900/50"
                  onClick={() => toggleExpand(change.path)}
                >
                  <span
                    className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      change.type === 'added'
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                        : change.type === 'removed'
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                          : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {change.type === 'added'
                      ? '+'
                      : change.type === 'removed'
                        ? '\u2212'
                        : '~'}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">
                    {change.label}
                  </span>
                  {(isPromptChange || hasLongContent) && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {expanded ? '\u25BE' : '\u25B8'}
                    </span>
                  )}
                </div>

                {/* Inline preview for short values */}
                {!isPromptChange && !hasLongContent && change.type === 'modified' && (
                  <div className="px-4 pb-3 flex items-center gap-2 text-sm">
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded line-through">
                      {change.leftValue}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">&rarr;</span>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                      {change.rightValue}
                    </span>
                  </div>
                )}

                {/* Expanded word-level diff for prompts */}
                {expanded &&
                  change.type === 'modified' &&
                  change.leftValue &&
                  change.rightValue && (
                    <div className="px-4 pb-3">
                      <div className="text-sm font-mono bg-slate-50 dark:bg-[#0d1117] rounded-lg p-3 border border-slate-200 dark:border-midnight-700 whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                        {wordDiffSegments(change.leftValue, change.rightValue).map(
                          (seg, i) =>
                            seg.op === 'delete' ? (
                              <span
                                key={i}
                                className="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 line-through"
                              >
                                {seg.text}
                              </span>
                            ) : seg.op === 'insert' ? (
                              <span
                                key={i}
                                className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
                              >
                                {seg.text}
                              </span>
                            ) : (
                              <span key={i}>{seg.text}</span>
                            )
                        )}
                      </div>
                    </div>
                  )}

                {/* Expanded content for added/removed */}
                {expanded && change.type !== 'modified' && (
                  <div className="px-4 pb-3">
                    <pre
                      className={`text-sm font-mono rounded-lg p-3 border whitespace-pre-wrap ${
                        change.type === 'added'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                      }`}
                    >
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
