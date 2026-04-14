import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../context/ThemeContext';
import type { Flow, Step } from '../../types';
import { createEmptyFlow } from '../../lib/flow';

// ReactFlow requires a browser canvas environment that jsdom doesn't provide.
// Mock the entire @xyflow/react module so FlowGraph renders its shell without
// the canvas. The mock ReactFlow calls onNodeClick for each node so we can
// simulate clicking a step to open the detail panel.
vi.mock('@xyflow/react', async () => {
  const React = await import('react');
  const MockReactFlow = ({
    nodes,
    onNodeClick,
    children,
  }: {
    nodes: { id: string; type: string; data: unknown }[];
    onNodeClick?: (
      e: React.MouseEvent,
      node: { id: string; type: string; data: unknown }
    ) => void;
    children?: React.ReactNode;
  }) =>
    React.createElement(
      'div',
      { 'data-testid': 'react-flow' },
      nodes.map((node) =>
        React.createElement(
          'button',
          {
            key: node.id,
            'data-testid': `node-${node.id}`,
            onClick: (e: React.MouseEvent) => onNodeClick?.(e, node),
          },
          node.id
        )
      ),
      children
    );

  return {
    ReactFlow: MockReactFlow,
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    Panel: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'rf-panel' }, children),
    Handle: () => null,
    Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
    MarkerType: { ArrowClosed: 'arrowclosed' },
  };
});

// Also mock the stylesheet import
vi.mock('@xyflow/react/dist/style.css', () => ({}));

// Lazy import FlowGraph AFTER mocks are in place
const { default: FlowGraph } = await import('../FlowGraph');

function makeStep(id: string, title: string): Step {
  return {
    id,
    type: 'general_knowledge',
    title,
    prompt: 'A test prompt for this step',
    agentName: '',
    source: 'General knowledge',
    outputPref: 'Fast',
    creativityLevel: 5,
    placeholder: '',
    defaultValue: '',
    config: '',
    references: '',
  };
}

function makeFlow(overrides: Partial<Flow> = {}): Flow {
  return {
    ...createEmptyFlow(),
    title: 'Test Flow',
    ...overrides,
  };
}

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('FlowGraph', () => {
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('empty flow state', () => {
    it('shows "No flow loaded" message when flow has no items', () => {
      renderWithTheme(<FlowGraph flow={makeFlow({ items: [] })} onBack={onBack} />);
      expect(screen.getByText('No flow loaded')).toBeInTheDocument();
    });

    it('renders the Back button in empty state', () => {
      renderWithTheme(<FlowGraph flow={makeFlow({ items: [] })} onBack={onBack} />);
      expect(screen.getByText(/← Back/)).toBeInTheDocument();
    });

    it('calls onBack when Back is clicked in empty state', async () => {
      const user = userEvent.setup();
      renderWithTheme(<FlowGraph flow={makeFlow({ items: [] })} onBack={onBack} />);
      await user.click(screen.getByText(/← Back/));
      expect(onBack).toHaveBeenCalledOnce();
    });
  });

  describe('with flow items', () => {
    const flowWithSteps = makeFlow({
      title: 'My Analysis Flow',
      items: [makeStep('step-a', 'Gather Data'), makeStep('step-b', 'Summarize')],
    });

    it('renders the flow title in the header', () => {
      renderWithTheme(<FlowGraph flow={flowWithSteps} onBack={onBack} />);
      expect(screen.getByText('My Analysis Flow')).toBeInTheDocument();
    });

    it('shows the step count in the header', () => {
      renderWithTheme(<FlowGraph flow={flowWithSteps} onBack={onBack} />);
      expect(screen.getByText(/2 steps/)).toBeInTheDocument();
    });

    it('renders the ReactFlow canvas container', () => {
      renderWithTheme(<FlowGraph flow={flowWithSteps} onBack={onBack} />);
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('calls onBack when Back is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<FlowGraph flow={flowWithSteps} onBack={onBack} />);
      await user.click(screen.getByText(/← Back/));
      expect(onBack).toHaveBeenCalledOnce();
    });

    it('shows "(Untitled)" in header when flow has no title', () => {
      renderWithTheme(
        <FlowGraph
          flow={makeFlow({ title: '', items: [makeStep('s1', 'Step')] })}
          onBack={onBack}
        />
      );
      expect(screen.getByText('(Untitled)')).toBeInTheDocument();
    });
  });

  describe('detail panel', () => {
    const flowWithStep = makeFlow({
      title: 'Detail Flow',
      items: [makeStep('s1', 'Gather Data')],
    });

    it('does not show the detail panel on initial render', () => {
      renderWithTheme(<FlowGraph flow={flowWithStep} onBack={onBack} />);
      expect(screen.queryByLabelText('Close detail panel')).not.toBeInTheDocument();
    });

    it('opens detail panel showing step title when a step node is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<FlowGraph flow={flowWithStep} onBack={onBack} />);
      // The mock ReactFlow renders a button for each node
      await user.click(screen.getByTestId('node-step-s1'));
      expect(screen.getByLabelText('Close detail panel')).toBeInTheDocument();
      expect(screen.getByText('Gather Data')).toBeInTheDocument();
    });

    it('shows the step prompt in the detail panel', async () => {
      const user = userEvent.setup();
      renderWithTheme(<FlowGraph flow={flowWithStep} onBack={onBack} />);
      await user.click(screen.getByTestId('node-step-s1'));
      expect(screen.getByText('A test prompt for this step')).toBeInTheDocument();
    });

    it('closes the detail panel when the close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<FlowGraph flow={flowWithStep} onBack={onBack} />);
      await user.click(screen.getByTestId('node-step-s1'));
      await user.click(screen.getByLabelText('Close detail panel'));
      expect(screen.queryByLabelText('Close detail panel')).not.toBeInTheDocument();
    });
  });
});
