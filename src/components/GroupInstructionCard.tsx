import { useState } from "react";
import type { Group } from "../types";
import { parseGroupInstructions } from "../lib/parser";

interface GroupInstructionCardProps {
  item: Group;
  index: number;
  onUpdate: (updated: Group) => void;
}

export default function GroupInstructionCard({
  item,
  index,
  onUpdate,
}: GroupInstructionCardProps) {
  const [rawInput, setRawInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [extracted, setExtracted] = useState(!!item.reasoningInstructions);

  const handleParse = async () => {
    if (!rawInput.trim()) return;
    setParsing(true);
    try {
      const result = await parseGroupInstructions(rawInput);
      onUpdate({
        ...item,
        runCondition:
          (result.runCondition as Group["runCondition"]) || item.runCondition,
        reasoningInstructions: result.reasoningInstructions || rawInput,
      });
      setExtracted(true);
    } catch {
      onUpdate({ ...item, reasoningInstructions: rawInput });
      setExtracted(true);
    }
    setParsing(false);
  };

  return (
    <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50 space-y-2">
      <div className="flex items-center gap-2">
        <span>🔄</span>
        <span className="font-semibold text-purple-800">
          {item.title || `Group ${index + 1}`}
        </span>
        <span className="text-xs text-purple-500">
          ({item.steps.length} steps inside)
        </span>
        {extracted && item.reasoningInstructions && (
          <span className="text-xs text-green-600 font-medium">
            ✓ extracted
          </span>
        )}
      </div>

      {extracted && item.reasoningInstructions ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">
              Run Condition:
            </span>
            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">
              {item.runCondition}
            </span>
          </div>
          <div className="bg-white border rounded p-3 text-sm font-mono whitespace-pre-wrap">
            {item.reasoningInstructions}
          </div>
          <button
            onClick={() => {
              setExtracted(false);
              setRawInput("");
            }}
            className="text-xs text-purple-600 hover:text-purple-800"
          >
            ↻ Re-paste
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            className="w-full border rounded px-3 py-2 text-sm bg-white font-mono focus:border-purple-400"
            rows={4}
            placeholder={
              "Open this group in QuickSuite → Ctrl+A → Ctrl+C → Ctrl+V here\n\nAI will extract the reasoning instructions."
            }
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
          />
          <button
            onClick={handleParse}
            disabled={parsing || !rawInput.trim()}
            className={`px-4 py-1.5 rounded text-sm font-medium ${
              parsing
                ? "bg-gray-300 text-gray-500"
                : rawInput.trim()
                  ? "bg-purple-700 text-white hover:bg-purple-800"
                  : "bg-gray-200 text-gray-400"
            }`}
          >
            {parsing ? "⏳ Extracting..." : "🧠 Extract Instructions"}
          </button>
        </div>
      )}
    </div>
  );
}
