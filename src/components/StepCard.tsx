import { useState } from 'react';
import type { Step, StepType } from '../types';
import { STEP_TYPES } from '../constants';
import StepFields from './StepFields';

interface StepCardProps {
  step: Step;
  onChange: (step: Step) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function StepCard({
  step,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: StepCardProps) {
  const [open, setOpen] = useState(false);
  const meta = STEP_TYPES.find((x) => x.value === step.type);
  const label = step.title || `${meta?.label} (untitled)`;
  const panelId = `step-panel-${step.id}`;

  return (
    <div
      className="border border-slate-200 dark:border-midnight-700 rounded-lg bg-white dark:bg-midnight-800"
      role="region"
      aria-label={label}
    >
      <div
        className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-midnight-900/50 rounded-t-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-midnight-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
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
          <span className="text-sm shrink-0" aria-hidden="true">
            {meta?.icon}
          </span>
          <span className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isFirst && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label={`Move ${label} up`}
            >
              {'\u25B2'}
            </button>
          )}
          {!isLast && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label={`Move ${label} down`}
            >
              {'\u25BC'}
            </button>
          )}
          <span
            className="text-xs text-slate-400 dark:text-slate-500 ml-1"
            aria-hidden="true"
          >
            {open ? '\u25BE' : '\u25B8'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-red-500 hover:text-red-400 text-xs ml-1 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label={`Remove ${label}`}
          >
            {'\u2715'}
          </button>
        </div>
      </div>

      {open && (
        <div id={panelId} className="p-3 space-y-2">
          <label className="sr-only" htmlFor={`step-type-${step.id}`}>
            Step type
          </label>
          <select
            id={`step-type-${step.id}`}
            className="border border-slate-200 dark:border-midnight-700 rounded px-2 py-1 text-xs bg-slate-100 dark:bg-midnight-900 text-slate-700 dark:text-slate-300"
            value={step.type}
            onChange={(e) => onChange({ ...step, type: e.target.value as StepType })}
          >
            {STEP_TYPES.map((x) => (
              <option key={x.value} value={x.value}>
                {x.icon} {x.label}
              </option>
            ))}
          </select>
          <StepFields step={step} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
