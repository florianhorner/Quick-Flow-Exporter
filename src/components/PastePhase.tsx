import type { HistoryEntry } from "../types";
import BookmarkletPanel from "./BookmarkletPanel";

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
  return (
    <div className="space-y-4">
      <div className="bg-midnight-800 border border-midnight-700 rounded-xl shadow-sm p-6 space-y-4">
        <div className="text-center space-y-2">
          <div className="text-4xl">📋</div>
          <h2 className="text-xl font-bold font-mono text-white">
            Paste your <span className="text-cyan-400">QuickSuite Flow</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Open your Flow in Editor mode →{" "}
            <kbd className="px-1.5 py-0.5 bg-midnight-900 border border-midnight-700 rounded text-xs font-mono text-cyan-400">Ctrl+A</kbd>
            {" → "}
            <kbd className="px-1.5 py-0.5 bg-midnight-900 border border-midnight-700 rounded text-xs font-mono text-cyan-400">Ctrl+C</kbd>
            {" → "}
            <kbd className="px-1.5 py-0.5 bg-midnight-900 border border-midnight-700 rounded text-xs font-mono text-cyan-400">Ctrl+V</kbd>
            {" here"}
          </p>
        </div>

        <label htmlFor="paste-input" className="sr-only">
          Paste your QuickSuite Flow content
        </label>
        <textarea
          id="paste-input"
          className="w-full border border-midnight-700 rounded-lg px-4 py-3 text-sm font-mono bg-[#0d1117] text-slate-300 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
          rows={12}
          placeholder={
            "// Paste your flow content here...\n\nTip: In QuickSuite Flow Editor, press Ctrl+A to select all, then Ctrl+C to copy."
          }
          value={raw}
          onChange={(e) => onRawChange(e.target.value)}
          autoFocus
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {raw.length > 0 ? `${raw.length.toLocaleString()} chars` : ""}
          </span>
          <button
            onClick={onParse}
            disabled={parsing || !raw.trim()}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              parsing
                ? "bg-midnight-700 text-slate-500"
                : raw.trim()
                  ? "bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/25"
                  : "bg-midnight-700 text-slate-500"
            }`}
          >
            {parsing ? "⏳ Parsing with AI..." : "🧠 Parse & Extract →"}
          </button>
        </div>

        {parseError && (
          <div role="alert" className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-400">
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
              <div
                key={i}
                className="flex items-center justify-between text-sm py-1"
              >
                <span className="text-slate-300">
                  {h.title || "(Untitled)"}
                </span>
                <span className="text-xs text-slate-500">
                  {h.stepCount} steps ·{" "}
                  {new Date(h.date).toLocaleDateString()}
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
