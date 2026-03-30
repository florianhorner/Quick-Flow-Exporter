import { useState } from 'react';
import type { HistoryEntry } from '../types';
import BookmarkletPanel from './BookmarkletPanel';
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
  parsing: boolean;
  parseError: string | null;
  history: HistoryEntry[];
}

export default function PastePhase({
  raw,
  onRawChange,
  onParse,
  parsing,
  parseError,
  history,
}: PastePhaseProps) {
  const [needsKey, setNeedsKey] = useState(false);
  const [keyValue, setKeyValue] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider>(getProvider());
  const hasKey = !!getApiKey();

  const currentProviderInfo = PROVIDERS.find((p) => p.value === selectedProvider)!;
  const isBedrock = selectedProvider === 'bedrock';

  const handleProviderChange = (provider: Provider) => {
    setSelectedProvider(provider);
    setProvider(provider);
    // Clear the key input when switching — stored key persists until overwritten
    setKeyValue('');
  };

  const handleParse = () => {
    // Bedrock uses server-side AWS credentials, no client key needed
    if (!isBedrock && !getApiKey()) {
      setNeedsKey(true);
      return;
    }
    onParse();
  };

  const handleKeySaveAndParse = () => {
    setApiKey(keyValue);
    setNeedsKey(false);
    setKeyValue('');
    onParse();
  };

  return (
    <div className="space-y-4">
      <div className="bg-midnight-800 border border-midnight-700 rounded-xl shadow-sm p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold font-mono text-white">Paste your flow</h2>
          <p className="text-slate-400 text-sm">
            Open your flow in the Quick Flows editor, then{' '}
            <kbd className="px-1.5 py-0.5 bg-midnight-900 border border-midnight-700 rounded text-xs font-mono text-cyan-400">
              Ctrl+A
            </kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-midnight-900 border border-midnight-700 rounded text-xs font-mono text-cyan-400">
              Ctrl+C
            </kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-midnight-900 border border-midnight-700 rounded text-xs font-mono text-cyan-400">
              Ctrl+V
            </kbd>
            {' here.'}
          </p>
        </div>

        <label htmlFor="paste-input" className="sr-only">
          Paste your flow content
        </label>
        <textarea
          id="paste-input"
          className="w-full border border-midnight-700 rounded-lg px-4 py-3 text-sm font-mono bg-[#0d1117] text-slate-300 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
          rows={12}
          placeholder={
            '// Paste your flow content here...\n\nTip: In the Quick Flows editor, press Ctrl+A to select all, then Ctrl+C to copy.'
          }
          value={raw}
          onChange={(e) => onRawChange(e.target.value)}
          autoFocus
        />

        {needsKey && (
          <div className="bg-midnight-900 border border-cyan-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-300">
                Configure AI provider
              </span>
            </div>

            {/* Provider selector */}
            <div className="space-y-2">
              <label
                htmlFor="provider-select"
                className="text-xs font-medium text-slate-500"
              >
                Provider
              </label>
              <select
                id="provider-select"
                value={selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value as Provider)}
                className="w-full border border-midnight-700 rounded-lg px-3 py-2 text-sm bg-[#0d1117] text-slate-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
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
                  className="flex-1 border border-midnight-700 rounded-lg px-3 py-2 text-sm font-mono bg-[#0d1117] text-slate-300 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                />
                <button
                  onClick={handleKeySaveAndParse}
                  disabled={!keyValue.trim() || !raw.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-midnight-700 disabled:text-slate-500"
                >
                  Save & Parse
                </button>
              </div>
            )}

            {isBedrock && (
              <div className="flex gap-2">
                <p className="flex-1 text-xs text-slate-500">
                  Bedrock uses server-side AWS credentials. Make sure the proxy server has
                  access to <code className="text-cyan-500">~/.aws/credentials</code> or
                  the appropriate environment variables.
                </p>
                <button
                  onClick={() => {
                    setNeedsKey(false);
                    onParse();
                  }}
                  disabled={!raw.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-midnight-700 disabled:text-slate-500"
                >
                  Parse
                </button>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Stored in your browser only. Or set the appropriate env var on the proxy
              server (
              {currentProviderInfo.value === 'anthropic' && (
                <code className="text-cyan-500">ANTHROPIC_API_KEY</code>
              )}
              {currentProviderInfo.value === 'openai' && (
                <code className="text-cyan-500">OPENAI_API_KEY</code>
              )}
              {currentProviderInfo.value === 'gemini' && (
                <code className="text-cyan-500">GEMINI_API_KEY</code>
              )}
              {currentProviderInfo.value === 'perplexity' && (
                <code className="text-cyan-500">PERPLEXITY_API_KEY</code>
              )}
              {currentProviderInfo.value === 'bedrock' && (
                <code className="text-cyan-500">AWS_REGION</code>
              )}
              ).
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">
              {raw.length > 0 ? `${raw.length.toLocaleString()} chars` : ''}
            </span>
            {/* Provider badge */}
            <span className="text-xs text-slate-600">{currentProviderInfo.label}</span>
            <button
              onClick={() => {
                setNeedsKey(true);
                setKeyValue(getApiKey());
              }}
              className="text-xs text-slate-600 hover:text-slate-400"
            >
              {hasKey || isBedrock ? 'Settings' : 'Set API key'}
            </button>
          </div>
          <button
            onClick={handleParse}
            disabled={parsing || !raw.trim()}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              parsing
                ? 'bg-midnight-700 text-slate-500'
                : raw.trim()
                  ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/25'
                  : 'bg-midnight-700 text-slate-500'
            }`}
          >
            {parsing ? 'Parsing...' : 'Parse & Extract'}
          </button>
        </div>

        {parseError && (
          <div
            role="alert"
            className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-400"
          >
            {parseError}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="bg-midnight-800 border border-midnight-700 rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-slate-500 mb-2 font-mono">
            Recent Exports
          </h3>
          <div className="space-y-1">
            {history.slice(0, 5).map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <span className="text-slate-300">{h.title || '(Untitled)'}</span>
                <span className="text-xs text-slate-500">
                  {h.stepCount} steps · {new Date(h.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <BookmarkletPanel />
    </div>
  );
}
