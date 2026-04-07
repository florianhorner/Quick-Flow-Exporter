import { useState } from 'react';
import type { Group } from '../types';
import { parseGroupInstructions } from '../lib/parser';

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
  const [rawInput, setRawInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [extracted, setExtracted] = useState(!!item.reasoningInstructions);

  const handleParse = async () => {
    if (!rawInput.trim()) return;
    setParsing(true);
    try {
      const result = await parseGroupInstructions(rawInput);
      onUpdate({
        ...item,
        runCondition: (result.runCondition as Group['runCondition']) || item.runCondition,
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
    <div className="border border-purple-300 dark:border-purple-800 border-l-4 border-l-purple-500 rounded-lg p-4 bg-white dark:bg-midnight-800 space-y-2">
      <div className="flex items-center gap-2">
        <span>{'\uD83D\uDD04'}</span>
        <span className="font-semibold text-purple-700 dark:text-purple-300 font-mono">
          {item.title || `Group ${index + 1}`}
        </span>
        <span className="text-xs text-purple-400 dark:text-purple-500">
          ({item.steps.length} steps inside)
        </span>
        {extracted && item.reasoningInstructions && (
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {'\u2713'} extracted
          </span>
        )}
      </div>

      {extracted && item.reasoningInstructions ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              Run Condition:
            </span>
            <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
              {item.runCondition}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-midnight-700 rounded p-3 text-sm font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300">
            {item.reasoningInstructions}
          </div>
          <button
            onClick={() => {
              setExtracted(false);
              setRawInput('');
            }}
            className="text-xs text-purple-500 dark:text-purple-400 hover:text-purple-400 dark:hover:text-purple-300"
          >
            {'\u21BB'} Re-paste
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            className="w-full border border-slate-200 dark:border-midnight-700 rounded px-3 py-2 text-sm bg-slate-50 dark:bg-[#0d1117] text-slate-700 dark:text-slate-300 font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:border-purple-500"
            rows={4}
            placeholder={
              'Open this group in Quick Flows \u2192 Ctrl+A \u2192 Ctrl+C \u2192 Ctrl+V here\n\nAI will extract the reasoning instructions.'
            }
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
          />
          <button
            onClick={handleParse}
            disabled={parsing || !rawInput.trim()}
            className={`px-4 py-1.5 rounded text-sm font-medium ${
              parsing
                ? 'bg-slate-200 dark:bg-midnight-700 text-slate-400 dark:text-slate-500'
                : rawInput.trim()
                  ? 'bg-purple-700 text-white hover:bg-purple-600'
                  : 'bg-slate-200 dark:bg-midnight-700 text-slate-400 dark:text-slate-500'
            }`}
          >
            {parsing ? 'Extracting...' : 'Extract Instructions'}
          </button>
        </div>
      )}
    </div>
  );
}
