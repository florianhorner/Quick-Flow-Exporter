import type { StepTypeOption, OutputPref, Source, RunCondition } from "./types";

export const STEP_TYPES: StepTypeOption[] = [
  { value: "chat_agent", label: "Chat Agent", icon: "🤖" },
  { value: "general_knowledge", label: "General Knowledge", icon: "🧠" },
  { value: "web_search", label: "Web Search", icon: "🌐" },
  { value: "ui_agent", label: "UI Agent", icon: "🖱️" },
  { value: "create_image", label: "Create Image", icon: "🖼️" },
  { value: "quicksuite_data", label: "Quick Suite Data", icon: "📊" },
  { value: "dashboard_topics", label: "Dashboards & Topics", icon: "📈" },
  { value: "app_actions", label: "Application Actions", icon: "⚡" },
  { value: "user_input_text", label: "User Input (Text)", icon: "📝" },
  { value: "user_input_files", label: "User Input (Files)", icon: "📎" },
];

export const OUTPUT_PREFS: OutputPref[] = [
  "Fast",
  "Versatility and performance",
  "Advanced reasoning (beta)",
];

export const SOURCES: Source[] = [
  "General knowledge",
  "Web search",
  "Quick Suite data",
];

export const RUN_CONDITIONS: RunCondition[] = [
  "Once",
  "If this, then that",
  "Run if true",
  "Skip if this happens",
  "Only run if",
  "Validate",
  "Validate data range",
];

export const STORAGE_KEY_HISTORY = "qs-export-history";

export const PROMPT_STEP_TYPES: string[] = [
  "chat_agent",
  "general_knowledge",
  "web_search",
  "ui_agent",
  "create_image",
  "quicksuite_data",
  "dashboard_topics",
];
