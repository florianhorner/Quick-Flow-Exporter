import { useState, useEffect, useCallback, useRef } from 'react';
import type { Flow, FlowItem, Phase, HistoryEntry } from './types';
import { createEmptyFlow, allGroups, allSteps } from './lib/flow';
import { parseFlow } from './lib/parser';
import { loadHistory, saveHistory } from './lib/storage';
import { useTheme } from './context/ThemeContext';
import PastePhase from './components/PastePhase';
import GroupsPhase from './components/GroupsPhase';
import ReviewPhase from './components/ReviewPhase';
import ExportPhase from './components/ExportPhase';
import FlowGraph from './components/FlowGraph';
import DiffPhase from './components/DiffPhase';

export default function App() {
  const [flow, setFlow] = useState<Flow>(createEmptyFlow());
  const [raw, setRaw] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('paste');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const { mode, toggle } = useTheme();

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const parseIdRef = useRef(0);

  const doParse = useCallback(async () => {
    if (!raw.trim()) return;
    const currentId = ++parseIdRef.current;
    setParsing(true);
    setParseError(null);
    try {
      const parsed = await parseFlow(raw);
      if (parseIdRef.current !== currentId) return; // stale — reset or new parse happened
      setFlow(parsed);
      const hasGroups = allGroups(parsed.items).length > 0;
      setPhase(hasGroups ? 'groups' : 'review');
    } catch (e) {
      if (parseIdRef.current !== currentId) return;
      setParseError(`Parsing failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (parseIdRef.current === currentId) setParsing(false);
  }, [raw]);

  const recordExport = useCallback(async () => {
    const entry: HistoryEntry = {
      title: flow.title,
      date: new Date().toISOString(),
      stepCount: allSteps(flow.items).length,
    };
    const next = [entry, ...history].slice(0, 20);
    setHistory(next);
    await saveHistory(next);
  }, [flow, history]);

  const downloadMarkdown = useCallback(() => {
    recordExport();
  }, [recordExport]);

  const updateItem = (i: number, item: FlowItem) => {
    const items = [...flow.items];
    items[i] = item;
    setFlow({ ...flow, items });
  };

  const resetToNew = () => {
    parseIdRef.current++; // invalidate any in-flight parse
    setParsing(false);
    setPhase('paste');
    setFlow(createEmptyFlow());
    setRaw('');
    setParseError(null);
  };

  const hasFlow = flow.items.length > 0;
  const groups = allGroups(flow.items);

  const themeIcon =
    mode === 'light' ? '\u2600\uFE0F' : mode === 'dark' ? '\uD83C\uDF19' : '\uD83D\uDCBB';
  const themeLabel = mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System';

  const navBtn = (active: boolean, activeColor: string) =>
    `px-3 py-2 text-sm rounded font-medium transition-colors ${
      active
        ? `${activeColor} text-white`
        : 'bg-white dark:bg-midnight-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-midnight-700 border border-slate-200 dark:border-midnight-700'
    }`;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-midnight-800 border-b border-slate-200 dark:border-midnight-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
              Quick Flow Exporter
            </span>
            {phase !== 'paste' && flow.title && (
              <span className="text-sm text-slate-400 dark:text-slate-500 truncate max-w-xs">
                — {flow.title}
              </span>
            )}
          </div>

          <div
            className="flex gap-2 items-center"
            role="navigation"
            aria-label="Phase navigation"
          >
            {hasFlow && (
              <>
                {groups.length > 0 && (
                  <button
                    onClick={() => setPhase('groups')}
                    className={navBtn(phase === 'groups', 'bg-purple-700')}
                  >
                    Groups
                  </button>
                )}
                <button
                  onClick={() => setPhase('review')}
                  className={navBtn(phase === 'review', 'bg-blue-700')}
                >
                  Review
                </button>
                <button
                  onClick={() => setPhase('graph')}
                  className={navBtn(phase === 'graph', 'bg-blue-700')}
                >
                  Graph
                </button>
                <button
                  onClick={() => setPhase('export')}
                  className={navBtn(phase === 'export', 'bg-blue-700')}
                >
                  Export
                </button>
              </>
            )}
            <button
              onClick={() => setPhase('diff')}
              className={navBtn(phase === 'diff', 'bg-orange-700')}
            >
              Diff
            </button>
            <button
              onClick={resetToNew}
              className="px-3 py-2 text-sm rounded font-medium bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20"
            >
              {phase === 'paste' ? 'Paste Mode' : 'New Export'}
            </button>
            <button
              onClick={toggle}
              className="px-2 py-1.5 text-sm rounded font-medium bg-slate-100 dark:bg-midnight-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-midnight-600 border border-slate-200 dark:border-midnight-600 transition-colors"
              aria-label={`Theme: ${themeLabel}. Click to cycle.`}
              title={`Theme: ${themeLabel}`}
            >
              {themeIcon}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        {phase === 'paste' && (
          <PastePhase
            raw={raw}
            onRawChange={setRaw}
            onParse={doParse}
            parsing={parsing}
            parseError={parseError}
            history={history}
          />
        )}

        {phase === 'groups' && (
          <GroupsPhase
            flow={flow}
            onUpdateItem={(i, item) => updateItem(i, item)}
            onBack={() => setPhase('paste')}
            onContinue={() => setPhase('review')}
          />
        )}

        {phase === 'review' && (
          <ReviewPhase
            flow={flow}
            onFlowChange={setFlow}
            onExport={() => setPhase('export')}
          />
        )}

        {phase === 'export' && (
          <ExportPhase
            flow={flow}
            onDownload={downloadMarkdown}
            onBack={() => setPhase('review')}
          />
        )}

        {phase === 'graph' && <FlowGraph flow={flow} onBack={() => setPhase('review')} />}

        {phase === 'diff' && (
          <DiffPhase
            currentFlow={flow.items.length > 0 ? flow : null}
            onBack={() =>
              flow.items.length > 0 ? setPhase('review') : setPhase('paste')
            }
          />
        )}
      </div>
    </div>
  );
}
