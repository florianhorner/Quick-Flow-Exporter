import { useState } from 'react';
import type { Group, Step, StepType } from '../types';
import { STEP_TYPES, RUN_CONDITIONS } from '../constants';
import { createEmptyStep } from '../lib/flow';
import StepCard from './StepCard';
import IconButton from './IconButton';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Plus,
  RotateCw,
  Trash2,
} from 'lucide-react';

interface GroupCardProps {
  group: Group;
  onChange: (group: Group) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function GroupCard({
  group,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: GroupCardProps) {
  const [open, setOpen] = useState(false);
  const [addType, setAddType] = useState<StepType>('general_knowledge');
  const label = group.title || 'Reasoning Group';
  const panelId = `group-panel-${group.id}`;

  const updateStep = (i: number, s: Step) => {
    const steps = [...group.steps];
    steps[i] = s;
    onChange({ ...group, steps });
  };

  const removeStep = (i: number) =>
    onChange({ ...group, steps: group.steps.filter((_, j) => j !== i) });

  const moveStep = (i: number, dir: number) => {
    const steps = [...group.steps];
    const target = i + dir;
    if (target < 0 || target >= steps.length) return;
    [steps[i]!, steps[target]!] = [steps[target]!, steps[i]!];
    onChange({ ...group, steps });
  };

  return (
    <div
      className="border border-purple-300 dark:border-purple-800 border-l-4 border-l-purple-500 rounded-md bg-white dark:bg-midnight-800"
      role="region"
      aria-label={label}
    >
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-t-md cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(!open);
          }
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <RotateCw
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-300"
          />
          <span className="font-medium text-sm text-purple-700 dark:text-purple-300 truncate">
            {label}
          </span>
          <span className="text-xs text-purple-400 dark:text-purple-500">
            ({group.steps.length} steps)
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {!isFirst && (
            <IconButton
              icon={ArrowUp}
              label={`Move ${label} up`}
              tone="purple"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
            />
          )}
          {!isLast && (
            <IconButton
              icon={ArrowDown}
              label={`Move ${label} down`}
              tone="purple"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
            />
          )}
          {open ? (
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 text-purple-400 dark:text-purple-500"
            />
          ) : (
            <ChevronRight
              aria-hidden="true"
              className="h-4 w-4 text-purple-400 dark:text-purple-500"
            />
          )}
          <IconButton
            icon={Trash2}
            label={`Remove ${label}`}
            tone="danger"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          />
        </div>
      </div>

      {open && (
        <div id={panelId} className="p-3 space-y-2">
          <label htmlFor={`group-title-${group.id}`} className="sr-only">
            Group title
          </label>
          <input
            id={`group-title-${group.id}`}
            className="w-full border border-slate-200 dark:border-midnight-700 rounded px-2 py-1 text-sm bg-slate-100 dark:bg-midnight-900 text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:border-purple-500"
            placeholder="Group Title"
            value={group.title}
            onChange={(e) => onChange({ ...group, title: e.target.value })}
          />
          <label htmlFor={`run-cond-${group.id}`} className="sr-only">
            Run condition
          </label>
          <select
            id={`run-cond-${group.id}`}
            className="border border-slate-200 dark:border-midnight-700 rounded px-2 py-1 text-xs bg-slate-100 dark:bg-midnight-900 text-slate-700 dark:text-slate-300"
            value={group.runCondition}
            onChange={(e) =>
              onChange({
                ...group,
                runCondition: e.target.value as Group['runCondition'],
              })
            }
          >
            {RUN_CONDITIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <label htmlFor={`reasoning-${group.id}`} className="sr-only">
            Reasoning instructions
          </label>
          <textarea
            id={`reasoning-${group.id}`}
            className="w-full border border-slate-200 dark:border-midnight-700 rounded px-2 py-1 text-sm bg-slate-50 dark:bg-[#0d1117] text-slate-700 dark:text-slate-300 font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:border-purple-500"
            rows={2}
            placeholder="Reasoning Instructions"
            value={group.reasoningInstructions}
            onChange={(e) =>
              onChange({ ...group, reasoningInstructions: e.target.value })
            }
          />

          <div
            className="space-y-2 ml-1 border-l-2 border-purple-300 dark:border-purple-800 pl-3"
            role="list"
            aria-label="Group steps"
          >
            {group.steps.map((s, i) => (
              <div role="listitem" key={s.id}>
                <StepCard
                  step={s}
                  onChange={(ns) => updateStep(i, ns)}
                  onRemove={() => removeStep(i)}
                  onMoveUp={() => moveStep(i, -1)}
                  onMoveDown={() => moveStep(i, 1)}
                  isFirst={i === 0}
                  isLast={i === group.steps.length - 1}
                />
              </div>
            ))}
            <div className="flex gap-2 items-center">
              <label htmlFor={`add-step-type-${group.id}`} className="sr-only">
                New step type
              </label>
              <select
                id={`add-step-type-${group.id}`}
                className="border border-slate-200 dark:border-midnight-700 rounded px-2 py-1 text-xs bg-slate-100 dark:bg-midnight-900 text-slate-700 dark:text-slate-300"
                value={addType}
                onChange={(e) => setAddType(e.target.value as StepType)}
              >
                {STEP_TYPES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.icon} {x.label}
                  </option>
                ))}
              </select>
              <button
                aria-label="Add step"
                onClick={() =>
                  onChange({
                    ...group,
                    steps: [...group.steps, createEmptyStep(addType)],
                  })
                }
                className="inline-flex items-center gap-1.5 bg-purple-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-purple-700"
              >
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
