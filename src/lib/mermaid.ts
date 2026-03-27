import type { Flow, Step } from "../types";

/** Generate a Mermaid flowchart from a Flow definition. */
export function generateMermaid(flow: Flow): string {
  const lines: string[] = ["flowchart TD"];
  const sanitize = (s: string) =>
    s.replace(/"/g, "'").replace(/[[\](){}#;]/g, "").slice(0, 60);

  let prevId: string | null = null;
  let globalIdx = 0;

  for (const item of flow.items) {
    if (item.isGroup) {
      const gid = `G${globalIdx}`;
      lines.push(`  subgraph ${gid}["🔄 ${sanitize(item.title || "Group")}"]`);
      lines.push(`    direction TD`);
      lines.push(`    ${gid}_cond{{"${sanitize(item.runCondition)}"}}`);

      let prevChild: string | null = `${gid}_cond`;
      for (let i = 0; i < item.steps.length; i++) {
        const step = item.steps[i]!;
        const sid = `${gid}_S${i}`;
        const icon = stepIcon(step);
        lines.push(`    ${sid}["${icon} ${sanitize(step.title || "Step")}"]`);
        if (prevChild) lines.push(`    ${prevChild} --> ${sid}`);
        prevChild = sid;
      }
      lines.push(`  end`);

      if (prevId) lines.push(`  ${prevId} --> ${gid}_cond`);
      prevId = item.steps.length > 0
        ? `${gid}_S${item.steps.length - 1}`
        : `${gid}_cond`;
      globalIdx++;
    } else {
      const sid = `S${globalIdx}`;
      const icon = stepIcon(item);
      lines.push(`  ${sid}["${icon} ${sanitize(item.title || "Step")}"]`);
      if (prevId) lines.push(`  ${prevId} --> ${sid}`);
      prevId = sid;
      globalIdx++;
    }
  }

  // Add @reference edges as dotted lines
  const stepTitleToId = new Map<string, string>();
  let idx = 0;
  for (const item of flow.items) {
    if (item.isGroup) {
      for (let i = 0; i < item.steps.length; i++) {
        stepTitleToId.set(item.steps[i]!.title.toLowerCase(), `G${idx}_S${i}`);
      }
      idx++;
    } else {
      stepTitleToId.set(item.title.toLowerCase(), `S${idx}`);
      idx++;
    }
  }

  idx = 0;
  for (const item of flow.items) {
    if (item.isGroup) {
      for (let i = 0; i < item.steps.length; i++) {
        const step = item.steps[i]!;
        addRefEdges(step, `G${idx}_S${i}`, stepTitleToId, lines);
      }
      idx++;
    } else {
      addRefEdges(item, `S${idx}`, stepTitleToId, lines);
      idx++;
    }
  }

  // Styling
  lines.push("");
  lines.push("  classDef agent fill:#dbeafe,stroke:#3b82f6,color:#1e40af");
  lines.push("  classDef knowledge fill:#dcfce7,stroke:#22c55e,color:#166534");
  lines.push("  classDef input fill:#fef9c3,stroke:#eab308,color:#854d0e");
  lines.push("  classDef group fill:#f5f3ff,stroke:#a78bfa,color:#6d28d9");

  return lines.join("\n");
}

function stepIcon(step: Step): string {
  const icons: Record<string, string> = {
    chat_agent: "🤖", general_knowledge: "🧠", web_search: "🌐",
    ui_agent: "🖱️", create_image: "🖼️", quicksuite_data: "📊",
    dashboard_topics: "📈", app_actions: "⚡",
    user_input_text: "📝", user_input_files: "📎",
  };
  return icons[step.type] ?? "?";
}

function addRefEdges(step: Step, stepId: string, titleMap: Map<string, string>, lines: string[]) {
  if (!step.references) return;
  for (const ref of step.references.split(",")) {
    const refName = ref.trim().replace(/^@/, "").toLowerCase();
    const targetId = titleMap.get(refName);
    if (targetId && targetId !== stepId) {
      lines.push(`  ${targetId} -.->|"@ref"| ${stepId}`);
    }
  }
}
