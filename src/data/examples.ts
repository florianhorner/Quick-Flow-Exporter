import type { Flow, Group, Step } from '../types';

// These fixtures share nested step/group objects by reference. Deep-freeze them
// so an accidental in-place mutation by a future consumer fails loudly instead
// of silently corrupting the shared graph. Consumers structuredClone() before
// editing, and cloning a frozen object yields a mutable copy, so this is safe.
function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj)) deepFreeze(value);
    Object.freeze(obj);
  }
  return obj;
}

export const exampleFlow = deepFreeze({
  title: 'Customer Renewal Triage',
  description:
    'Reviews an upcoming renewal, checks account context, assesses risk, and drafts an account-manager follow-up.',
  status: 'Draft',
  shared: false,
  schedules: 'Manual run before renewal reviews',
  items: [
    {
      id: 'example-collect-customer-info',
      type: 'user_input_text',
      title: 'Collect Customer Info',
      prompt:
        'Ask the user for company name, industry, renewal date, and the primary concern for this renewal.',
      agentName: '',
      source: 'General knowledge',
      outputPref: 'Versatility and performance',
      creativityLevel: 4,
      placeholder: 'Company, industry, renewal date, concern',
      defaultValue: '',
      config: 'Required before lookup',
      references: '',
    },
    {
      id: 'example-risk-review-group',
      isGroup: true,
      title: 'Renewal Risk Review',
      runCondition: 'Run if true',
      reasoningInstructions:
        'Run this group when the account health score is below 70, the renewal is within 45 days, or there are unresolved support cases.',
      steps: [
        {
          id: 'example-find-account-record',
          type: 'quicksuite_data',
          title: 'Find Account Record',
          prompt:
            'Search account data for @Collect Customer Info company name. Return account id, contract tier, renewal date, health score, and open support cases.',
          agentName: '',
          source: 'Quick Suite data',
          outputPref: 'Versatility and performance',
          creativityLevel: 3,
          placeholder: '',
          defaultValue: '',
          config: 'Dataset: customer_accounts',
          references: 'Collect Customer Info',
        },
        {
          id: 'example-assess-contract-risk',
          type: 'chat_agent',
          title: 'Assess Contract Risk',
          prompt:
            'Use @Find Account Record to classify renewal risk as low, medium, or high. Explain the top two risk drivers and one recommended next action.',
          agentName: 'Renewal Analyst',
          source: 'General knowledge',
          outputPref: 'Advanced reasoning (beta)',
          creativityLevel: 5,
          placeholder: '',
          defaultValue: '',
          config: 'Return risk, drivers, next_action',
          references: 'Find Account Record',
        },
      ],
    },
    {
      id: 'example-draft-follow-up',
      type: 'general_knowledge',
      title: 'Draft Follow-up',
      prompt:
        'Create a concise account-manager summary using @Assess Contract Risk. Include the risk level, evidence, and next action.',
      agentName: '',
      source: 'General knowledge',
      outputPref: 'Versatility and performance',
      creativityLevel: 6,
      placeholder: '',
      defaultValue: '',
      config: 'Tone: direct and customer-ready',
      references: 'Assess Contract Risk',
    },
    {
      id: 'example-notify-salesforce',
      type: 'app_actions',
      title: 'Notify Salesforce',
      prompt:
        'Create a Salesforce task with the follow-up summary from @Draft Follow-up and assign it to the account owner.',
      agentName: '',
      source: 'General knowledge',
      outputPref: 'Fast',
      creativityLevel: 2,
      placeholder: '',
      defaultValue: '',
      config: 'Action: create_task',
      references: 'Draft Follow-up',
    },
  ],
} satisfies Flow);

const collectCustomerInfoStep = exampleFlow.items[0]! as Step;
const riskReviewGroup = exampleFlow.items[1]! as Group;
const draftFollowUpStep = exampleFlow.items[2]! as Step;

export const exampleDiffBefore = deepFreeze({
  ...exampleFlow,
  title: 'Customer Renewal Triage v1',
  description: 'Reviews an upcoming renewal and drafts an account-manager follow-up.',
  items: [
    collectCustomerInfoStep,
    {
      ...riskReviewGroup,
      steps: [
        riskReviewGroup.steps[0]!,
        {
          ...riskReviewGroup.steps[1]!,
          prompt:
            'Use @Find Account Record to classify renewal risk as low, medium, or high.',
        },
      ],
    },
    {
      ...draftFollowUpStep,
      prompt: 'Create an internal account-manager summary using @Assess Contract Risk.',
    },
  ],
} satisfies Flow);

export const exampleDiffAfter = deepFreeze({
  ...exampleFlow,
  title: 'Customer Renewal Triage v2',
  shared: true,
} satisfies Flow);
