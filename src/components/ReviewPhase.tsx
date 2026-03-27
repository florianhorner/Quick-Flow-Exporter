import type { Flow, FlowItem, StepType } from "../types";
import { STEP_TYPES } from "../constants";
import { createEmptyStep, createEmptyGroup, allSteps, allGroups } from "../lib/flow";
import StepCard from "./StepCard";
import GroupCard from "./GroupCard";
import { useState } from "react";

interface ReviewPhaseProps {
  flow: Flow;
  onFlowChange: (flow: Flow) => void;
  onExport: () => void;
}

export default function ReviewPhase({
  flow,
  onFlowChange,
  onExport,
}: ReviewPhaseProps) {
  const [addType, setAddType] = useState<StepType>("general_knowledge");
  const steps = allSteps(flow.items);
  const groups = allGroups(flow.items);

  const updateItem = (i: number, item: FlowItem) => {
    const items = [...flow.items];
    items[i] = item;
    onFlowChange({ ...flow, items });
  };

  const removeItem = (i: number) =>
    onFlowChange({ ...flow, items: flow.items.filter((_, j) => j !== i) });

  const moveItem = (i: number, dir: number) => {
    const items = [...flow.items];
    const target = i + dir;
    if (target < 0 || target >= items.length) return;
    [items[i]!, items[target]!] = [items[target]!, items[i]!];
    onFlowChange({ ...flow, items });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <div>
            <div className="font-semibold text-sm">
              {flow.title || "(Untitled)"}
            </div>
            <div className="text-xs text-gray-500">
              {steps.length} steps · {groups.length} groups · {flow.status}
            </div>
          </div>
        </div>
        <div className="flex-1" />
        <button
          onClick={onExport}
          className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 shadow"
        >
          📄 Export Markdown →
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 space-y-2">
        <div className="flex gap-2 flex-wrap">
          <input
            className="flex-1 min-w-48 border rounded px-3 py-2 text-sm font-semibold bg-white"
            placeholder="Flow Title"
            value={flow.title}
            onChange={(e) => onFlowChange({ ...flow, title: e.target.value })}
          />
          <select
            className="border rounded px-2 py-1 text-sm bg-white"
            value={flow.status}
            onChange={(e) =>
              onFlowChange({
                ...flow,
                status: e.target.value as Flow["status"],
              })
            }
          >
            <option>Draft</option>
            <option>Published</option>
          </select>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={flow.shared}
              onChange={(e) =>
                onFlowChange({ ...flow, shared: e.target.checked })
              }
            />
            Shared
          </label>
        </div>
        <textarea
          className="w-full border rounded px-3 py-2 text-sm bg-white"
          rows={2}
          placeholder="Description"
          value={flow.description}
          onChange={(e) =>
            onFlowChange({ ...flow, description: e.target.value })
          }
        />
      </div>

      <div className="space-y-3">
        {flow.items.map((item, i) =>
          item.isGroup ? (
            <GroupCard
              key={item.id}
              group={item}
              onChange={(g) => updateItem(i, g)}
              onRemove={() => removeItem(i)}
              onMoveUp={() => moveItem(i, -1)}
              onMoveDown={() => moveItem(i, 1)}
              isFirst={i === 0}
              isLast={i === flow.items.length - 1}
            />
          ) : (
            <StepCard
              key={item.id}
              step={item}
              onChange={(s) => updateItem(i, s)}
              onRemove={() => removeItem(i)}
              onMoveUp={() => moveItem(i, -1)}
              onMoveDown={() => moveItem(i, 1)}
              isFirst={i === 0}
              isLast={i === flow.items.length - 1}
            />
          ),
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 flex flex-wrap gap-2 items-center">
        <select
          className="border rounded px-2 py-1 text-sm bg-white"
          value={addType}
          onChange={(e) => setAddType(e.target.value as StepType)}
        >
          {STEP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.icon} {t.label}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            onFlowChange({
              ...flow,
              items: [...flow.items, createEmptyStep(addType)],
            })
          }
          className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded hover:bg-gray-800"
        >
          + Step
        </button>
        <button
          onClick={() =>
            onFlowChange({
              ...flow,
              items: [...flow.items, createEmptyGroup()],
            })
          }
          className="bg-purple-600 text-white text-sm px-4 py-1.5 rounded hover:bg-purple-700"
        >
          + Group
        </button>
      </div>
    </div>
  );
}
