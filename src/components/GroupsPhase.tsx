import type { Flow, Group } from "../types";
import { allGroups } from "../lib/flow";
import GroupInstructionCard from "./GroupInstructionCard";

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
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="text-center space-y-2">
          <div className="text-4xl">🔄</div>
          <h2 className="text-xl font-bold">Reasoning Group Instructions</h2>
          <p className="text-gray-500 text-sm">
            {groups.length} Reasoning Group{groups.length > 1 ? "s" : ""} found.
            For each group: open it in QuickSuite, Ctrl+A, Ctrl+C, paste below.
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
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={onContinue}
              className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              Skip →
            </button>
            <button
              onClick={onContinue}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
            >
              Continue to Review →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
