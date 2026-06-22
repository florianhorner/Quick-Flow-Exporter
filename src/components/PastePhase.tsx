import { useState } from 'react';
import type { HistoryEntry } from '../types';
import BookmarkletPanel from './BookmarkletPanel';
import { DEMO_MODE_MESSAGE } from '../config';
import {
  AlertTriangle,
  Bot,
  ClipboardPaste,
  KeyRound,
  Play,
  Settings,
} from 'lucide-react';
import {
  getApiKey,
  setApiKey,
  getProvider,
  setProvider,
  PROVIDERS,
  type Provider,
} from '../lib/ai';

interface PastePhaseProps {
  raw: string;
  onRawChange: (value: string) => void;
  onParse: () => void;
  onLoadExample: () => void;
  parsing: boolean;
  parseError: string | null;
  history: HistoryEntry[];
  demoMode?: boolean;
}

export default function PastePhase({
  raw,
  onRawChange,
  onParse,
  onLoadExample,
  parsing,
  parseError,
  history,
  demoMode = false,
}: PastePhaseProps) {
  const [needsKey, setNeedsKey] = useState(false);
  const [keyValue, setKeyValue] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider>(getProvider());
  const hasKey = !!getApiKey();

  const currentProviderInfo = PROVIDERS.find((p) => p.value === selectedProvider)!;
  const isBedrock = selectedProvider === 'bedrock';
  const canParse = !demoMode && !parsing && raw.trim().length > 0;

  const handleProviderChange = (provider: Provider) => {
    setSelectedProvider(provider);
    setProvider(provider);
    // Clear the key input when switching — stored key persists until overwritten
    setKeyValue('');
  };

  const handleParse = () => {
    if (demoMode) return;
    // Bedrock uses server-side AWS credentials, no client key needed
    if (!isBedrock && !getApiKey()) {
      setNeedsKey(true);
      return;
    }
    onParse();
  };

  const handleKeySaveAndParse = () => {
    if (demoMode) return;
    setApiKey(keyValue);
    setNeedsKey(false);
    setKeyValue('');
    onParse();
  };

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-midnight-800 border border-slate-200 dark:border-midnight-700 rounded-lg shadow-sm p-5 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-mono text-slate-900 dark:text-white">
              Paste your flow
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Copy all text from the Quick Flows editor with{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-midnight-900 border border-slate-200 dark:border-midnight-700 rounded text-xs font-mono text-blue-600 dark:text-blue-400">
                Ctrl+A
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-midnight-900 border border-slate-200 dark:border-midnight-700 rounded text-xs font-mono text-blue-600 dark:text-blue-400">
                Ctrl+C
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-midnight-900 border border-slate-200 dark:border-midnight-700 rounded text-xs font-mono text-blue-600 dark:text-blue-400">
                Ctrl+V
              </kbd>
              .
            </p>
          </div>
          {!demoMode && (
            <button
              onClick={() => {
                setNeedsKey(true);
                setKeyValue(getApiKey());
              }}
              className={`inline-flex items-center gap-1.5 text-xs ${
                hasKey || isBedrock
                  ? 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                  : 'font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300'
              }`}
            >
              <Settings aria-hidden="true" className="h-3.5 w-3.5" />
              {hasKey || isBedrock ? 'Settings' : 'Set API key'}
            </button>
          )}
        </div>

        {demoMode && (
          <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2 font-semibold">
              <Bot aria-hidden="true" className="h-4 w-4" />
              Hosted demo mode
            </div>
            <p className="mt-1 text-xs leading-5">
              {DEMO_MODE_MESSAGE} Use the bundled example to inspect the graph, export
              formats, and diff workflow without sending data to an AI provider.
            </p>
            <button
              onClick={onLoadExample}
              className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/20"
            >
              <ClipboardPaste aria-hidden="true" className="h-4 w-4" />
              Load example
            </button>
          </div>
        )}

        <label htmlFor="paste-input" className="sr-only">
          Paste your flow content
        </label>
        <textarea
          id="paste-input"
          className="w-full border border-slate-200 dark:border-midnight-700 rounded-lg px-4 py-3 text-sm font-mono bg-slate-50 dark:bg-[#0d1117] text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
          rows={12}
          placeholder={
            '// Paste your flow content here...\n\nTip: Ctrl+A, Ctrl+C in the Quick Flows editor, then Ctrl+V here.'
          }
          value={raw}
          onChange={(e) => onRawChange(e.target.value)}
          autoFocus
        />

        {!demoMode && needsKey && (
          <div className="bg-slate-50 dark:bg-midnight-900 border border-blue-300/50 dark:border-blue-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound
                aria-hidden="true"
                className="h-4 w-4 text-blue-600 dark:text-blue-400"
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Configure AI provider
              </span>
            </div>

            {/* Provider selector */}
            <div className="space-y-2">
              <label
                htmlFor="provider-select"
                className="text-xs font-medium text-slate-400 dark:text-slate-500"
              >
                Provider
              </label>
              <select
                id="provider-select"
                value={selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value as Provider)}
                className="w-full border border-slate-200 dark:border-midnight-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-[#0d1117] text-slate-700 dark:text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* API key input (hidden for Bedrock) */}
            {!isBedrock && (
              <div className="flex gap-2">
                <input
                  type="password"
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && keyValue.trim() && raw.trim())
                      handleKeySaveAndParse();
                  }}
                  placeholder={currentProviderInfo.keyPlaceholder}
                  autoFocus
                  className="flex-1 border border-slate-200 dark:border-midnight-700 rounded-lg px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-[#0d1117] text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                />
                <button
                  onClick={handleKeySaveAndParse}
                  disabled={!keyValue.trim() || !raw.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-midnight-700 disabled:text-slate-400 dark:disabled:text-slate-500"
                >
                  <Play aria-hidden="true" className="h-4 w-4" />
                  Save & Parse
                </button>
              </div>
            )}

            {isBedrock && (
              <div className="flex gap-2">
                <p className="flex-1 text-xs text-slate-400 dark:text-slate-500">
                  Bedrock uses server-side AWS credentials. Make sure the proxy server has
                  access to{' '}
                  <code className="text-blue-600 dark:text-blue-500">
                    ~/.aws/credentials
                  </code>{' '}
                  or the appropriate environment variables.
                </p>
                <button
                  onClick={() => {
                    setNeedsKey(false);
                    onParse();
                  }}
                  disabled={!raw.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-midnight-700 disabled:text-slate-400 dark:disabled:text-slate-500"
                >
                  <Play aria-hidden="true" className="h-4 w-4" />
                  Parse
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400 dark:text-slate-500">
              Stored in your browser only. Or set the appropriate env var on the proxy
              server (
              {currentProviderInfo.value === 'anthropic' && (
                <code className="text-blue-600 dark:text-blue-500">
                  ANTHROPIC_API_KEY
                </code>
              )}
              {currentProviderInfo.value === 'openai' && (
                <code className="text-blue-600 dark:text-blue-500">OPENAI_API_KEY</code>
              )}
              {currentProviderInfo.value === 'gemini' && (
                <code className="text-blue-600 dark:text-blue-500">GEMINI_API_KEY</code>
              )}
              {currentProviderInfo.value === 'perplexity' && (
                <code className="text-blue-600 dark:text-blue-500">
                  PERPLEXITY_API_KEY
                </code>
              )}
              {currentProviderInfo.value === 'bedrock' && (
                <code className="text-blue-600 dark:text-blue-500">AWS_REGION</code>
              )}
              ).
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {raw.length > 0 ? `${raw.length.toLocaleString()} chars` : ''}
            </span>
            {!demoMode && (
              <>
                <span className="rounded border border-slate-200 dark:border-midnight-700 px-2 py-1 text-xs text-slate-500 dark:text-slate-400">
                  {currentProviderInfo.label}
                </span>
              </>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {!demoMode && (
              <button
                onClick={onLoadExample}
                className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold bg-slate-100 dark:bg-midnight-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-midnight-600 border border-slate-200 dark:border-midnight-600 sm:w-auto"
              >
                <ClipboardPaste aria-hidden="true" className="h-4 w-4" />
                Load example
              </button>
            )}
            <button
              onClick={handleParse}
              disabled={!canParse}
              className={`inline-flex w-full items-center justify-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold transition-all sm:w-auto ${
                canParse
                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/25'
                  : 'bg-slate-200 dark:bg-midnight-700 text-slate-400 dark:text-slate-500'
              }`}
            >
              <Play aria-hidden="true" className="h-4 w-4" />
              {demoMode
                ? 'Run locally to parse'
                : parsing
                  ? 'Parsing...'
                  : 'Parse & Extract'}
            </button>
          </div>
        </div>

        {parseError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400"
          >
            <AlertTriangle aria-hidden="true" className="mr-2 inline h-4 w-4" />
            {parseError}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="bg-white/70 dark:bg-midnight-800/70 border border-slate-200 dark:border-midnight-700 rounded-lg p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
            Recent Exports
          </h3>
          <div className="space-y-1">
            {history.slice(0, 5).map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <span className="text-slate-700 dark:text-slate-300">
                  {h.title || '(Untitled)'}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {h.stepCount} steps · {new Date(h.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-slate-400 dark:text-slate-500 px-1">
        <a
          href="https://github.com/florianhorner/Quick-Flow-Exporter/issues/new/choose"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Report a bug / Share feedback"
          className="hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2"
        >
          Report a bug / Share feedback
        </a>
      </div>

      <BookmarkletPanel />
    </div>
  );
}
