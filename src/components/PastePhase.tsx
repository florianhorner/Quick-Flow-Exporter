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
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="text-center space-y-2">
          <div className="text-4xl">📋</div>
          <h2 className="text-xl font-bold">Paste your QuickSuite Flow</h2>
          <p className="text-gray-500 text-sm">
            Open your Flow in Editor mode → Ctrl+A → Ctrl+C → Ctrl+V here
          </p>
        </div>

        <label htmlFor="paste-input" className="sr-only">
          Paste your QuickSuite Flow content
        </label>
        <textarea
          id="paste-input"
          className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm font-mono bg-gray-50 focus:border-amber-400 focus:bg-white transition-colors"
          rows={12}
          placeholder={
            "Paste the full page content here...\n\nTip: In QuickSuite Flow Editor, press Ctrl+A to select all, then Ctrl+C to copy."
          }
          value={raw}
          onChange={(e) => onRawChange(e.target.value)}
          autoFocus
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {raw.length > 0 ? `${raw.length.toLocaleString()} chars` : ""}
          </span>
          <button
            onClick={onParse}
            disabled={parsing || !raw.trim()}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              parsing
                ? "bg-gray-300 text-gray-500"
                : raw.trim()
                  ? "bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
                  : "bg-gray-200 text-gray-400"
            }`}
          >
            {parsing ? "⏳ Parsing with AI..." : "🧠 Parse & Extract →"}
          </button>
        </div>

        {parseError && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {parseError}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">
            Recent Exports
          </h3>
          <div className="space-y-1">
            {history.slice(0, 5).map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-1"
              >
                <span className="text-gray-700">
                  {h.title || "(Untitled)"}
                </span>
                <span className="text-xs text-gray-400">
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
