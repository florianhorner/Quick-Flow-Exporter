import { useState } from 'react';
import type { Step, StepType } from '../types';
import { STEP_TYPES } from '../constants';
import StepFields from './StepFields';
import IconButton from './IconButton';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

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
      className="border border-slate-200 dark:border-midnight-700 rounded-md bg-white dark:bg-midnight-800"
      role="region"
      aria-label={label}
    >
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-midnight-900/50 rounded-t-md cursor-pointer hover:bg-slate-100 dark:hover:bg-midnight-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
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
        <div className="flex items-center gap-0.5 shrink-0">
          {!isFirst && (
            <IconButton
              icon={ArrowUp}
              label={`Move ${label} up`}
              tone="ghost"
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
              tone="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
            />
          )}
          {open ? (
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 text-slate-400 dark:text-slate-500"
            />
          ) : (
            <ChevronRight
              aria-hidden="true"
              className="h-4 w-4 text-slate-400 dark:text-slate-500"
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
