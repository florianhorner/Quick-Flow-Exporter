import type { Flow, Step } from "../types";
import { STEP_TYPES } from "../constants";
import { allSteps, allGroups } from "./flow";

/** Escape backtick sequences that could break markdown code fences. */
function escapeCodeFence(str: string): string {
  return str.replace(/`{3,}/g, (m) => "`".repeat(m.length).replace(/`/g, "\\`"));
}

export function generateMarkdown(flow: Flow): string {
  let md = `# Flow: ${flow.title || "(Untitled)"}\n`;
  if (flow.description) md += `> ${flow.description}\n`;

  md += `\n| Property | Value |\n|---|---|\n`;
  md += `| Status | ${flow.status} |\n`;
  md += `| Shared | ${flow.shared ? "All" : "Private"} |\n`;
  if (flow.schedules) md += `| Schedules | ${flow.schedules} |\n`;
  md += `| Exported | ${new Date().toLocaleString()} |\n\n---\n\n`;

  let stepNumber = 1;

  const renderStep = (step: Step, inGroup: boolean): string => {
    const meta = STEP_TYPES.find((x) => x.value === step.type);
    const heading = inGroup ? "###" : "##";
    let s = `${heading} Step ${stepNumber}: ${step.title || "(Untitled)"}\n`;
    s += `- **Type:** ${meta?.icon ?? "?"} ${meta?.label ?? step.type}\n`;

    if (step.type === "chat_agent" && step.agentName) {
      s += `- **Chat Agent:** ${step.agentName}\n`;
    }

    if (step.type === "general_knowledge") {
      s += `- **Source:** ${step.source}\n`;
      s += `- **Output Preference:** ${step.outputPref}\n`;
      s += `- **Creativity Level:** ${step.creativityLevel}/10\n`;
    }

    if (step.prompt) {
      s += `- **Prompt:**\n  \`\`\`\n  ${escapeCodeFence(step.prompt).replace(/\n/g, "\n  ")}\n  \`\`\`\n`;
    }

    if (step.type === "user_input_text") {
      if (step.placeholder) s += `- **Placeholder:** ${step.placeholder}\n`;
      if (step.defaultValue) s += `- **Default Value:** ${step.defaultValue}\n`;
    }

    if (step.config) s += `- **Config:** ${step.config}\n`;
    if (step.references) s += `- **References:** ${step.references}\n`;

    stepNumber++;
    return s + "\n";
  };

  for (const item of flow.items) {
    if (item.isGroup) {
      md += `## 🔄 Reasoning Group: ${item.title || "(Untitled)"}\n`;
      md += `- **Run Condition:** ${item.runCondition}\n`;
      if (item.reasoningInstructions) {
        md += `- **Reasoning Instructions:**\n  \`\`\`\n  ${escapeCodeFence(item.reasoningInstructions).replace(/\n/g, "\n  ")}\n  \`\`\`\n`;
      }
      md += "\n";
      for (const step of item.steps) md += renderStep(step, true);
      md += "---\n\n";
    } else {
      md += renderStep(item, false);
    }
  }

  const steps = allSteps(flow.items);
  const groups = allGroups(flow.items);
  const agents = [
    ...new Set(steps.filter((s) => s.agentName).map((s) => s.agentName)),
  ];

  md += `---\n\n## Summary\n`;
  md += `- **Total steps:** ${steps.length}\n`;
  md += `- **Reasoning Groups:** ${groups.length}\n`;
  if (agents.length) md += `- **Chat Agents:** ${agents.join(", ")}\n`;

  return md;
}
