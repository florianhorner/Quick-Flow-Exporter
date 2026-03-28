import { useState } from "react";
import type { Step, StepType } from "../types";
import { STEP_TYPES } from "../constants";
import StepFields from "./StepFields";

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
    <div className="border border-midnight-700 rounded-lg bg-midnight-800" role="region" aria-label={label}>
      <div
        className="flex items-center justify-between px-3 py-2 bg-midnight-900/50 rounded-t-lg cursor-pointer"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0" aria-hidden="true">{meta?.icon}</span>
          <span className="font-medium text-sm text-slate-200 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isFirst && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              className="text-slate-500 hover:text-slate-300 text-xs px-1"
              aria-label={`Move ${label} up`}
            >▲</button>
          )}
          {!isLast && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              className="text-slate-500 hover:text-slate-300 text-xs px-1"
              aria-label={`Move ${label} down`}
            >▼</button>
          )}
          <span className="text-xs text-slate-500 ml-1" aria-hidden="true">
            {open ? "▾" : "▸"}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-red-500 hover:text-red-400 text-xs ml-1"
            aria-label={`Remove ${label}`}
          >✕</button>
        </div>
      </div>

      {open && (
        <div id={panelId} className="p-3 space-y-2">
          <label className="sr-only" htmlFor={`step-type-${step.id}`}>
            Step type
          </label>
          <select
            id={`step-type-${step.id}`}
            className="border border-midnight-700 rounded px-2 py-1 text-xs bg-midnight-900 text-slate-300"
            value={step.type}
            onChange={(e) =>
              onChange({ ...step, type: e.target.value as StepType })
            }
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
