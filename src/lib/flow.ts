import type { Step, Group, Flow, FlowItem, StepType } from '../types';

export function createEmptyStep(type: StepType = 'general_knowledge'): Step {
  return {
    id: crypto.randomUUID(),
    type,
    title: '',
    prompt: '',
    agentName: '',
    source: 'General knowledge',
    outputPref: 'Versatility and performance',
    creativityLevel: 5,
    placeholder: '',
    defaultValue: '',
    config: '',
    references: '',
  };
}

export function createEmptyGroup(): Group {
  return {
    id: crypto.randomUUID(),
    isGroup: true,
    title: '',
    runCondition: 'Once',
    reasoningInstructions: '',
    steps: [],
  };
}

export function createEmptyFlow(): Flow {
  return {
    title: '',
    description: '',
    status: 'Draft',
    shared: false,
    schedules: '',
    items: [],
  };
}

export function hydrateItems(items: Partial<FlowItem>[]): FlowItem[] {
  return items.map((item) => {
    if (item.isGroup) {
      const group = item as Partial<Group>;
      return {
        ...createEmptyGroup(),
        ...group,
        id: crypto.randomUUID(),
        steps: (group.steps ?? []).map((s) => ({
          ...createEmptyStep(s.type),
          ...s,
          id: crypto.randomUUID(),
        })),
      };
    }
    const step = item as Partial<Step>;
    return {
      ...createEmptyStep(step.type),
      ...step,
      id: crypto.randomUUID(),
    };
  });
}

/** Collect all leaf steps from a flow's items. */
export function allSteps(items: FlowItem[]): Step[] {
  return items.flatMap((it) => (it.isGroup ? it.steps : [it]));
}

/** Collect all groups from a flow's items. */
export function allGroups(items: FlowItem[]): Group[] {
  return items.filter((it): it is Group => it.isGroup === true);
}
