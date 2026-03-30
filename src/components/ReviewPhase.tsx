import type { Flow, FlowItem, StepType } from '../types';
import { STEP_TYPES } from '../constants';
import { createEmptyStep, createEmptyGroup, allSteps, allGroups } from '../lib/flow';
import StepCard from './StepCard';
import GroupCard from './GroupCard';
import { useState } from 'react';

interface ReviewPhaseProps {
  flow: Flow;
  onFlowChange: (flow: Flow) => void;
  onExport: () => void;
}

export default function ReviewPhase({ flow, onFlowChange, onExport }: ReviewPhaseProps) {
  const [addType, setAddType] = useState<StepType>('general_knowledge');
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
      <div className="bg-white dark:bg-midnight-800 border border-slate-200 dark:border-midnight-700 rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 font-mono">
            REVIEW
          </span>
          <div>
            <div className="font-semibold text-sm text-slate-900 dark:text-white">
              {flow.title || '(Untitled)'}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">
              {steps.length} steps · {groups.length} groups · {flow.status}
            </div>
          </div>
        </div>
        <div className="flex-1" />
        <button
          onClick={onExport}
          className="bg-cyan-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-500 shadow-lg shadow-cyan-500/20"
        >
          Export
        </button>
      </div>

      <div className="bg-white dark:bg-midnight-800 border border-slate-200 dark:border-midnight-700 rounded-lg shadow-sm p-4 space-y-2">
        <div className="flex gap-2 flex-wrap">
          <input
            className="flex-1 min-w-48 border border-slate-200 dark:border-midnight-700 rounded px-3 py-2 text-sm font-semibold bg-slate-100 dark:bg-midnight-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-cyan-500"
            placeholder="Flow Title"
            value={flow.title}
            onChange={(e) => onFlowChange({ ...flow, title: e.target.value })}
          />
          <select
            className="border border-slate-200 dark:border-midnight-700 rounded px-2 py-1 text-sm bg-slate-100 dark:bg-midnight-900 text-slate-700 dark:text-slate-300"
            value={flow.status}
            onChange={(e) =>
              onFlowChange({
                ...flow,
                status: e.target.value as Flow['status'],
              })
            }
          >
            <option>Draft</option>
            <option>Published</option>
          </select>
          <label className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <input
              type="checkbox"
              checked={flow.shared}
              onChange={(e) => onFlowChange({ ...flow, shared: e.target.checked })}
              className="accent-cyan-500"
            />
            Shared
          </label>
        </div>
        <textarea
          className="w-full border border-slate-200 dark:border-midnight-700 rounded px-3 py-2 text-sm bg-slate-100 dark:bg-midnight-900 text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:border-cyan-500"
          rows={2}
          placeholder="Description"
          value={flow.description}
          onChange={(e) => onFlowChange({ ...flow, description: e.target.value })}
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
          )
        )}
      </div>

      <div className="bg-white dark:bg-midnight-800 border border-slate-200 dark:border-midnight-700 rounded-lg shadow-sm p-3 flex flex-wrap gap-2 items-center">
        <select
          className="border border-slate-200 dark:border-midnight-700 rounded px-2 py-1 text-sm bg-slate-100 dark:bg-midnight-900 text-slate-700 dark:text-slate-300"
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
          className="bg-cyan-600 text-white text-sm px-4 py-1.5 rounded hover:bg-cyan-500"
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
