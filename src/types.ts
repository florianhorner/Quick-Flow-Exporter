export type StepType =
  | 'chat_agent'
  | 'general_knowledge'
  | 'web_search'
  | 'ui_agent'
  | 'create_image'
  | 'quicksuite_data'
  | 'dashboard_topics'
  | 'app_actions'
  | 'user_input_text'
  | 'user_input_files';

export interface StepTypeOption {
  value: StepType;
  label: string;
  icon: string;
}

export type OutputPref =
  | 'Fast'
  | 'Versatility and performance'
  | 'Advanced reasoning (beta)';

export type Source = 'General knowledge' | 'Web search' | 'Quick Suite data';

export type RunCondition =
  | 'Once'
  | 'If this, then that'
  | 'Run if true'
  | 'Skip if this happens'
  | 'Only run if'
  | 'Validate'
  | 'Validate data range';

export interface Step {
  id: string;
  type: StepType;
  title: string;
  prompt: string;
  agentName: string;
  source: Source;
  outputPref: OutputPref;
  creativityLevel: number;
  placeholder: string;
  defaultValue: string;
  config: string;
  references: string;
  isGroup?: false;
}

export interface Group {
  id: string;
  isGroup: true;
  title: string;
  runCondition: RunCondition;
  reasoningInstructions: string;
  steps: Step[];
}

export type FlowItem = Step | Group;

export interface Flow {
  title: string;
  description: string;
  status: 'Draft' | 'Published';
  shared: boolean;
  schedules: string;
  items: FlowItem[];
}

export interface HistoryEntry {
  title: string;
  date: string;
  stepCount: number;
}

export type Phase = 'paste' | 'groups' | 'review' | 'export' | 'graph' | 'diff';

export interface FlowDiff {
  left: Flow;
  right: Flow;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'added' | 'removed' | 'modified';
  path: string;
  label: string;
  leftValue?: string;
  rightValue?: string;
}
