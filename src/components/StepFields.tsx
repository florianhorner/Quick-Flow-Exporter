import type { Step } from "../types";
import { SOURCES, OUTPUT_PREFS, PROMPT_STEP_TYPES } from "../constants";

interface StepFieldsProps {
  step: Step;
  onChange: (step: Step) => void;
}

export default function StepFields({ step, onChange }: StepFieldsProps) {
  const update = <K extends keyof Step>(field: K, value: Step[K]) =>
    onChange({ ...step, [field]: value });

  const uid = step.id;

  return (
    <div className="space-y-2">
      <label htmlFor={`title-${uid}`} className="sr-only">Step title</label>
      <input
        id={`title-${uid}`}
        className="w-full border rounded px-2 py-1 text-sm bg-white"
        placeholder="Step Title"
        value={step.title}
        onChange={(e) => update("title", e.target.value)}
        maxLength={100}
      />

      {step.type === "chat_agent" && (
        <>
          <label htmlFor={`agent-${uid}`} className="sr-only">Chat agent name</label>
          <input
            id={`agent-${uid}`}
            className="w-full border rounded px-2 py-1 text-sm bg-white"
            placeholder="Chat Agent Name"
            value={step.agentName}
            onChange={(e) => update("agentName", e.target.value)}
          />
        </>
      )}

      {step.type === "general_knowledge" && (
        <div className="flex gap-2 flex-wrap">
          <div>
            <label htmlFor={`source-${uid}`} className="sr-only">Source</label>
            <select
              id={`source-${uid}`}
              className="border rounded px-2 py-1 text-xs bg-white"
              value={step.source}
              onChange={(e) => update("source", e.target.value as Step["source"])}
            >
              {SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`output-${uid}`} className="sr-only">Output preference</label>
            <select
              id={`output-${uid}`}
              className="border rounded px-2 py-1 text-xs bg-white"
              value={step.outputPref}
              onChange={(e) =>
                update("outputPref", e.target.value as Step["outputPref"])
              }
            >
              {OUTPUT_PREFS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <label htmlFor={`creativity-${uid}`} className="flex items-center gap-1 text-xs">
            Creativity:
            <input
              id={`creativity-${uid}`}
              type="range"
              min="0"
              max="10"
              value={step.creativityLevel}
              onChange={(e) => update("creativityLevel", +e.target.value)}
              className="w-20"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={step.creativityLevel}
            />
            <span aria-hidden="true">{step.creativityLevel}</span>
          </label>
        </div>
      )}

      {PROMPT_STEP_TYPES.includes(step.type) && (
        <>
          <label htmlFor={`prompt-${uid}`} className="sr-only">Prompt</label>
          <textarea
            id={`prompt-${uid}`}
            className="w-full border rounded px-2 py-1 text-sm bg-white font-mono"
            rows={4}
            placeholder="Prompt / Instructions"
            value={step.prompt}
            onChange={(e) => update("prompt", e.target.value)}
            maxLength={5000}
          />
        </>
      )}

      {step.type === "user_input_text" && (
        <>
          <label htmlFor={`placeholder-${uid}`} className="sr-only">Placeholder text</label>
          <input
            id={`placeholder-${uid}`}
            className="w-full border rounded px-2 py-1 text-sm bg-white"
            placeholder="Placeholder"
            value={step.placeholder}
            onChange={(e) => update("placeholder", e.target.value)}
          />
          <label htmlFor={`default-${uid}`} className="sr-only">Default value</label>
          <input
            id={`default-${uid}`}
            className="w-full border rounded px-2 py-1 text-sm bg-white"
            placeholder="Default value"
            value={step.defaultValue}
            onChange={(e) => update("defaultValue", e.target.value)}
          />
        </>
      )}

      {(step.type === "app_actions" || step.type === "user_input_files") && (
        <>
          <label htmlFor={`config-${uid}`} className="sr-only">Configuration</label>
          <textarea
            id={`config-${uid}`}
            className="w-full border rounded px-2 py-1 text-sm bg-white font-mono"
            rows={3}
            placeholder="Configuration"
            value={step.config}
            onChange={(e) => update("config", e.target.value)}
          />
        </>
      )}

      <label htmlFor={`refs-${uid}`} className="sr-only">References</label>
      <input
        id={`refs-${uid}`}
        className="w-full border rounded px-2 py-1 text-xs bg-gray-50 text-gray-600"
        placeholder="@References (comma-separated)"
        value={step.references}
        onChange={(e) => update("references", e.target.value)}
      />
    </div>
  );
}
