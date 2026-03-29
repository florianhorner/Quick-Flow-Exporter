import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMarkdown } from '../markdown';
import { createEmptyFlow, createEmptyStep, createEmptyGroup } from '../flow';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
});

describe('generateMarkdown', () => {
  it('renders a minimal flow', () => {
    const flow = createEmptyFlow();
    flow.title = 'Test Flow';
    const md = generateMarkdown(flow);
    expect(md).toContain('# Flow: Test Flow');
    expect(md).toContain('| Status | Draft |');
    expect(md).toContain('**Total steps:** 0');
  });

  it('renders a step with prompt', () => {
    const flow = createEmptyFlow();
    flow.title = 'With Steps';
    const step = createEmptyStep('general_knowledge');
    step.title = 'Analyze Data';
    step.prompt = 'Analyze the sales data';
    step.source = 'Web search';
    step.outputPref = 'Fast';
    step.creativityLevel = 7;
    flow.items = [step];

    const md = generateMarkdown(flow);
    expect(md).toContain('## Step 1: Analyze Data');
    expect(md).toContain('🧠 General Knowledge');
    expect(md).toContain('**Source:** Web search');
    expect(md).toContain('**Creativity Level:** 7/10');
    expect(md).toContain('Analyze the sales data');
    expect(md).toContain('**Total steps:** 1');
  });

  it('renders a chat_agent step with agent name', () => {
    const flow = createEmptyFlow();
    const step = createEmptyStep('chat_agent');
    step.title = 'Agent Step';
    step.agentName = 'Sales Bot';
    flow.items = [step];

    const md = generateMarkdown(flow);
    expect(md).toContain('**Chat Agent:** Sales Bot');
    expect(md).toContain('**Chat Agents:** Sales Bot');
  });

  it('renders user_input_text with placeholder and default', () => {
    const flow = createEmptyFlow();
    const step = createEmptyStep('user_input_text');
    step.title = 'User Input';
    step.placeholder = 'Enter name';
    step.defaultValue = 'John';
    flow.items = [step];

    const md = generateMarkdown(flow);
    expect(md).toContain('**Placeholder:** Enter name');
    expect(md).toContain('**Default Value:** John');
  });

  it('renders groups with nested steps', () => {
    const flow = createEmptyFlow();
    const group = createEmptyGroup();
    group.title = 'Validation Group';
    group.runCondition = 'Validate';
    group.reasoningInstructions = 'Check if score > 80';
    const child = createEmptyStep('web_search');
    child.title = 'Search Step';
    child.prompt = 'Search for data';
    group.steps = [child];
    flow.items = [group];

    const md = generateMarkdown(flow);
    expect(md).toContain('## 🔄 Reasoning Group: Validation Group');
    expect(md).toContain('**Run Condition:** Validate');
    expect(md).toContain('Check if score > 80');
    expect(md).toContain('### Step 1: Search Step');
    expect(md).toContain('**Reasoning Groups:** 1');
  });

  it('renders description as blockquote', () => {
    const flow = createEmptyFlow();
    flow.title = 'Described';
    flow.description = 'A flow that does things';
    const md = generateMarkdown(flow);
    expect(md).toContain('> A flow that does things');
  });

  it('renders shared as All', () => {
    const flow = createEmptyFlow();
    flow.shared = true;
    const md = generateMarkdown(flow);
    expect(md).toContain('| Shared | All |');
  });

  it('renders schedules when present', () => {
    const flow = createEmptyFlow();
    flow.schedules = 'Daily at 9am';
    const md = generateMarkdown(flow);
    expect(md).toContain('| Schedules | Daily at 9am |');
  });

  it('renders references and config', () => {
    const flow = createEmptyFlow();
    const step = createEmptyStep('app_actions');
    step.title = 'Action';
    step.config = '{"key":"val"}';
    step.references = '@Step1, @Step2';
    flow.items = [step];

    const md = generateMarkdown(flow);
    expect(md).toContain('**Config:** {"key":"val"}');
    expect(md).toContain('**References:** @Step1, @Step2');
  });
});
