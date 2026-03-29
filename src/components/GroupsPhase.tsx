import type { Flow, Group } from '../types';
import { allGroups } from '../lib/flow';
import GroupInstructionCard from './GroupInstructionCard';

interface GroupsPhaseProps {
  flow: Flow;
  onUpdateItem: (index: number, item: Group) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function GroupsPhase({
  flow,
  onUpdateItem,
  onBack,
  onContinue,
}: GroupsPhaseProps) {
  const groups = allGroups(flow.items);

  return (
    <div className="space-y-4">
      <div className="bg-midnight-800 border border-midnight-700 rounded-xl shadow-sm p-6 space-y-4">
        <div className="text-center space-y-2">
          <div className="text-4xl">🔄</div>
          <h2 className="text-xl font-bold font-mono text-white">
            Reasoning Group Instructions
          </h2>
          <p className="text-slate-400 text-sm">
            {groups.length} Reasoning Group{groups.length > 1 ? 's' : ''} found. For each
            group: open it in Quick Flows, Ctrl+A, Ctrl+C, paste below.
          </p>
        </div>

        <div className="space-y-4">
          {flow.items.map((item, idx) => {
            if (!item.isGroup) return null;
            return (
              <GroupInstructionCard
                key={item.id}
                item={item}
                index={idx}
                onUpdate={(updated) => onUpdateItem(idx, updated)}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-slate-300"
          >
            ← Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={onContinue}
              className="px-4 py-2 text-sm rounded bg-midnight-700 hover:bg-midnight-600 text-slate-400"
            >
              Skip →
            </button>
            <button
              onClick={onContinue}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/20"
            >
              Continue to Review →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
