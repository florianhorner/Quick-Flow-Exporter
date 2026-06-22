import { useState, useEffect, useCallback, useRef } from 'react';
import type { Flow, FlowItem, Phase, HistoryEntry } from './types';
import { createEmptyFlow, allGroups, allSteps } from './lib/flow';
import { MAX_HISTORY_ENTRIES } from './constants';
import { parseFlow } from './lib/parser';
import { loadHistory, saveHistory } from './lib/storage';
import { useTheme } from './context/ThemeContext';
import { IS_DEMO_MODE } from './config';
import { exampleDiffAfter, exampleDiffBefore, exampleFlow } from './data/examples';
import PastePhase from './components/PastePhase';
import GroupsPhase from './components/GroupsPhase';
import ReviewPhase from './components/ReviewPhase';
import ExportPhase from './components/ExportPhase';
import FlowGraph from './components/FlowGraph';
import DiffPhase from './components/DiffPhase';
import IconButton from './components/IconButton';
import {
  Boxes,
  ClipboardPaste,
  FileText,
  GitCompare,
  ListChecks,
  Monitor,
  Moon,
  Network,
  RotateCcw,
  Sun,
} from 'lucide-react';

// Stable reference so DiffPhase's loadExampleDiff useCallback isn't invalidated
// on every App render by a freshly-allocated prop object.
const EXAMPLE_DIFF = { left: exampleDiffBefore, right: exampleDiffAfter };

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
    const next = [entry, ...history].slice(0, MAX_HISTORY_ENTRIES);
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

  const loadExample = () => {
    parseIdRef.current++; // invalidate any in-flight parse
    setParsing(false);
    setParseError(null);
    // The curated exampleFlow is the source of truth; do not pre-fill the paste
    // box with a sketch that would re-parse to a different flow (raw/flow drift).
    setRaw('');
    setFlow(structuredClone(exampleFlow));
    setPhase('graph');
  };

  const hasFlow = flow.items.length > 0;
  const groups = allGroups(flow.items);

  const ThemeIcon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
  const themeLabel = mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System';

  const navBtn = (active: boolean, activeColor: string) =>
    `inline-flex items-center gap-1.5 px-2.5 py-2 text-sm rounded-md font-medium transition-colors ${
      active
        ? `${activeColor} text-white`
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-midnight-700 border border-transparent'
    }`;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white/95 dark:bg-midnight-800/95 backdrop-blur border-b border-slate-200 dark:border-midnight-700 sticky top-0 z-10">
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
            className="flex flex-wrap gap-1.5 items-center justify-end"
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
                    <Boxes aria-hidden="true" className="h-4 w-4" />
                    Groups
                  </button>
                )}
                <button
                  onClick={() => setPhase('review')}
                  className={navBtn(phase === 'review', 'bg-blue-700')}
                >
                  <ListChecks aria-hidden="true" className="h-4 w-4" />
                  Review
                </button>
                <button
                  onClick={() => setPhase('graph')}
                  className={navBtn(phase === 'graph', 'bg-blue-700')}
                >
                  <Network aria-hidden="true" className="h-4 w-4" />
                  Graph
                </button>
                <button
                  onClick={() => setPhase('export')}
                  className={navBtn(phase === 'export', 'bg-blue-700')}
                >
                  <FileText aria-hidden="true" className="h-4 w-4" />
                  Export
                </button>
              </>
            )}
            <button
              onClick={() => setPhase('diff')}
              className={navBtn(phase === 'diff', 'bg-orange-700')}
            >
              <GitCompare aria-hidden="true" className="h-4 w-4" />
              Diff
            </button>
            <button
              onClick={resetToNew}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md font-medium bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/20 transition-colors"
            >
              {phase === 'paste' ? (
                <ClipboardPaste aria-hidden="true" className="h-4 w-4" />
              ) : (
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
              )}
              {phase === 'paste' ? 'Paste Mode' : 'New Export'}
            </button>
            <IconButton
              icon={ThemeIcon}
              label={`Theme: ${themeLabel}. Click to cycle.`}
              onClick={toggle}
              tone="neutral"
            />
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
            onLoadExample={loadExample}
            parsing={parsing}
            parseError={parseError}
            history={history}
            demoMode={IS_DEMO_MODE}
          />
        )}

        {phase === 'groups' && (
          <GroupsPhase
            flow={flow}
            onUpdateItem={(i, item) => updateItem(i, item)}
            onBack={() => setPhase('paste')}
            onContinue={() => setPhase('review')}
            demoMode={IS_DEMO_MODE}
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
            demoMode={IS_DEMO_MODE}
            exampleDiff={EXAMPLE_DIFF}
          />
        )}
      </div>
    </div>
  );
}
