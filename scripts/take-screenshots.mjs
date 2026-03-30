import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const BASE_URL = 'http://127.0.0.1:5173';

// Realistic mock flow response for "Customer Onboarding Assistant"
const MOCK_FLOW = {
  title: 'Customer Onboarding Assistant',
  description:
    'AI-powered customer onboarding flow with data validation and personalized welcome',
  status: 'Published',
  shared: true,
  schedules: '',
  items: [
    {
      isGroup: false,
      id: 'step-1',
      type: 'user_input_text',
      title: 'Collect Customer Info',
      prompt: 'Please provide your company name, industry, and primary use case.',
      placeholder: 'Enter company details...',
      defaultValue: '',
      references: '',
      agentName: '',
      source: 'General knowledge',
      outputPref: 'Versatility and performance',
      creativityLevel: 5,
      config: '',
    },
    {
      isGroup: false,
      id: 'step-2',
      type: 'quicksuite_data',
      title: 'Lookup CRM Record',
      prompt:
        'Search the CRM for existing records matching @Collect Customer Info company name. Return account ID, tier, and contract status.',
      references: 'Collect Customer Info',
      agentName: '',
      source: 'Quick Suite data',
      outputPref: 'Versatility and performance',
      creativityLevel: 5,
      placeholder: '',
      defaultValue: '',
      config: '',
    },
    {
      isGroup: true,
      id: 'group-1',
      title: 'Validation & Routing',
      runCondition: 'If this, then that',
      reasoningInstructions:
        'Check if the customer already exists in the CRM. If they do, route to the existing customer path. If not, create a new record.',
      steps: [
        {
          isGroup: false,
          id: 'step-3',
          type: 'general_knowledge',
          title: 'Validate Account Data',
          prompt:
            'Review @Lookup CRM Record and validate whether the account is active and in good standing. Flag any data inconsistencies.',
          references: 'Lookup CRM Record',
          agentName: '',
          source: 'General knowledge',
          outputPref: 'Advanced reasoning (beta)',
          creativityLevel: 3,
          placeholder: '',
          defaultValue: '',
          config: '',
        },
        {
          isGroup: false,
          id: 'step-4',
          type: 'web_search',
          title: 'Enrich Company Profile',
          prompt:
            'Search for recent news and company information about @Collect Customer Info company. Return industry trends and company size.',
          references: 'Collect Customer Info',
          agentName: '',
          source: 'Web search',
          outputPref: 'Fast',
          creativityLevel: 5,
          placeholder: '',
          defaultValue: '',
          config: '',
        },
      ],
    },
    {
      isGroup: false,
      id: 'step-5',
      type: 'chat_agent',
      title: 'Generate Welcome Message',
      prompt:
        'Using @Validate Account Data and @Enrich Company Profile, create a personalized onboarding welcome message. Include relevant product recommendations based on industry and company size.',
      references: 'Validate Account Data, Enrich Company Profile',
      agentName: 'Onboarding Agent',
      source: 'General knowledge',
      outputPref: 'Versatility and performance',
      creativityLevel: 7,
      placeholder: '',
      defaultValue: '',
      config: '',
    },
    {
      isGroup: false,
      id: 'step-6',
      type: 'app_actions',
      title: 'Create Onboarding Ticket',
      prompt:
        'Create a support ticket for the new customer onboarding. Include all data from @Generate Welcome Message and @Lookup CRM Record.',
      references: 'Generate Welcome Message, Lookup CRM Record',
      agentName: '',
      source: 'General knowledge',
      outputPref: 'Versatility and performance',
      creativityLevel: 5,
      placeholder: '',
      defaultValue: '',
      config:
        '{"ticketType": "onboarding", "priority": "high", "assignTeam": "customer-success"}',
    },
    {
      isGroup: false,
      id: 'step-7',
      type: 'dashboard_topics',
      title: 'Update Onboarding Dashboard',
      prompt:
        'Log this onboarding event to the analytics dashboard. Track conversion metrics from @Create Onboarding Ticket.',
      references: 'Create Onboarding Ticket',
      agentName: '',
      source: 'General knowledge',
      outputPref: 'Fast',
      creativityLevel: 3,
      placeholder: '',
      defaultValue: '',
      config: '',
    },
  ],
};

// Modified version for diff (changes some steps)
const MOCK_FLOW_MODIFIED = {
  ...MOCK_FLOW,
  items: [
    MOCK_FLOW.items[0],
    MOCK_FLOW.items[1],
    MOCK_FLOW.items[2],
    {
      ...MOCK_FLOW.items[3],
      prompt:
        'Using @Validate Account Data and @Enrich Company Profile, create a personalized onboarding welcome message. Include relevant product recommendations based on industry, company size, and recent funding rounds. Add a section for scheduled demo booking.',
      creativityLevel: 8,
    },
    {
      ...MOCK_FLOW.items[4],
      config:
        '{"ticketType": "onboarding", "priority": "critical", "assignTeam": "customer-success", "sla": "4h"}',
    },
    MOCK_FLOW.items[5],
    {
      isGroup: false,
      id: 'step-8',
      type: 'create_image',
      title: 'Generate Welcome Banner',
      prompt:
        'Create a personalized welcome banner image for the customer using their company branding from @Enrich Company Profile.',
      references: 'Enrich Company Profile',
      agentName: '',
      source: 'General knowledge',
      outputPref: 'Versatility and performance',
      creativityLevel: 9,
      placeholder: '',
      defaultValue: '',
      config: '',
    },
  ],
};

async function takeScreenshots() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Block external font requests to avoid timeout
  await page.route('**/*.woff2', (route) => route.abort());
  await page.route('**/*.woff', (route) => route.abort());
  await page.route('**/fonts.googleapis.com/**', (route) => route.abort());
  await page.route('**/fonts.gstatic.com/**', (route) => route.abort());

  // Mock API responses for parse requests
  let parseCallCount = 0;
  await page.route('**/api/parse', async (route) => {
    parseCallCount++;
    // First call returns the original flow, subsequent calls return modified
    const flow = parseCallCount <= 1 ? MOCK_FLOW : MOCK_FLOW_MODIFIED;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ text: JSON.stringify(flow) }),
    });
  });

  // Set API key and provider in localStorage before loading
  await page.goto(BASE_URL, { waitUntil: 'commit', timeout: 15000 });
  await page.evaluate(() => {
    localStorage.setItem('qf-api-key', 'sk-test-mock-key');
    localStorage.setItem('qf-provider', 'anthropic');
  });
  await page.reload({ waitUntil: 'commit', timeout: 15000 });
  await page.waitForTimeout(2000); // Wait for React to render

  // ── Screenshot 1: Paste Phase ──
  console.log('Taking paste phase screenshot...');
  await page.waitForSelector('textarea#paste-input');
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01-paste-phase.png'),
    fullPage: false,
  });
  console.log('✓ 01-paste-phase.png');

  // ── Parse the flow ──
  console.log('Parsing flow...');
  const pasteInput = await page.locator('textarea#paste-input');
  await pasteInput.fill('Sample flow content for parsing...');
  await page.click('button:has-text("Parse & Extract")');
  // Wait for groups phase to appear (since our mock flow has groups)
  await page.waitForSelector('text=Continue to Review', { timeout: 10000 });
  // Skip groups, go to review
  await page.click('button:has-text("Continue to Review")');
  await page.waitForSelector('text=Generate Welcome Message', { timeout: 5000 });

  // ── Navigate to Export ──
  console.log('Taking export phase screenshot...');
  await page.click('button:has-text("Export")');
  await page.waitForSelector('pre', { timeout: 5000 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '04-export-phase.png'),
    fullPage: false,
  });
  console.log('✓ 04-export-phase.png');

  // ── Navigate to Graph ──
  console.log('Taking flow graph screenshot...');
  await page.click('button:has-text("Graph")');
  await page.waitForSelector('.react-flow', { timeout: 5000 });
  await page.waitForTimeout(1500); // Let React Flow render and fit view
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '03-flow-graph.png'),
    fullPage: false,
  });
  console.log('✓ 03-flow-graph.png');

  // ── Navigate to Diff ──
  console.log('Taking diff phase screenshot...');
  await page.click('button:has-text("Diff")');
  await page.waitForSelector('text=Compare flows', { timeout: 5000 });
  // The "Before" side should already have the current flow loaded
  // Fill in the "After" textarea
  const afterTextarea = page.locator(
    'textarea[placeholder="Paste the AFTER version of the flow here..."]'
  );
  await afterTextarea.fill('Modified flow content for diff comparison...');
  // Click Compare Flows
  await page.click('button:has-text("Compare Flows")');
  await page.waitForSelector('text=DIFF', { timeout: 15000 });
  await page.waitForTimeout(500);
  // Expand the prompt diff to show word-level changes
  const promptDiff = page.locator('text=Generate Welcome Message → Prompt');
  if (await promptDiff.isVisible()) {
    await promptDiff.click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '02-diff-phase.png'),
    fullPage: false,
  });
  console.log('✓ 02-diff-phase.png');

  await browser.close();
  console.log('\nAll screenshots taken successfully!');
}

takeScreenshots().catch((e) => {
  console.error('Screenshot failed:', e);
  process.exit(1);
});
