import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiffPhase from '../DiffPhase';
import { createEmptyFlow } from '../../lib/flow';
import type { Flow } from '../../types';

vi.mock('../../lib/parser', () => ({
  parseFlow: vi.fn(),
}));

import { parseFlow } from '../../lib/parser';

function makeFlow(overrides: Partial<Flow> = {}): Flow {
  return { ...createEmptyFlow(), ...overrides };
}

describe('DiffPhase', () => {
  const onBack = vi.fn();

  // Renders the component with currentFlow, types into the After textarea, and
  // submits — landing on the result view. Shared by all result-state tests.
  async function driveToResult(
    user: ReturnType<typeof userEvent.setup>,
    currentFlow: Flow
  ) {
    render(<DiffPhase currentFlow={currentFlow} onBack={onBack} />);
    await user.type(screen.getByRole('textbox'), 'content');
    await user.click(screen.getByText('Compare Flows'));
  }

  beforeEach(() => {
    // resetAllMocks clears both call history AND implementations, so each test
    // starts with a clean parseFlow mock.
    vi.resetAllMocks();
  });

  describe('input state — no currentFlow', () => {
    it('shows the Compare flows heading', () => {
      render(<DiffPhase currentFlow={null} onBack={onBack} />);
      expect(screen.getByText('Compare flows')).toBeInTheDocument();
    });

    it('renders two textareas (before and after)', () => {
      render(<DiffPhase currentFlow={null} onBack={onBack} />);
      expect(screen.getAllByRole('textbox').length).toBe(2);
    });

    it('disables Compare button when both inputs are empty', () => {
      render(<DiffPhase currentFlow={null} onBack={onBack} />);
      expect(screen.getByText('Compare Flows')).toBeDisabled();
    });

    it('disables Compare button when only the left input has content', async () => {
      const user = userEvent.setup();
      render(<DiffPhase currentFlow={null} onBack={onBack} />);
      const [left] = screen.getAllByRole('textbox');
      await user.type(left!, 'before content');
      expect(screen.getByText('Compare Flows')).toBeDisabled();
    });

    it('disables Compare button when only the right input has content', async () => {
      const user = userEvent.setup();
      render(<DiffPhase currentFlow={null} onBack={onBack} />);
      const [, right] = screen.getAllByRole('textbox');
      await user.type(right!, 'after content');
      expect(screen.getByText('Compare Flows')).toBeDisabled();
    });

    it('enables Compare button when both inputs have content', async () => {
      const user = userEvent.setup();
      render(<DiffPhase currentFlow={null} onBack={onBack} />);
      const [left, right] = screen.getAllByRole('textbox');
      await user.type(left!, 'before');
      await user.type(right!, 'after');
      expect(screen.getByText('Compare Flows')).not.toBeDisabled();
    });

    it('calls onBack when Back is clicked', async () => {
      const user = userEvent.setup();
      render(<DiffPhase currentFlow={null} onBack={onBack} />);
      await user.click(screen.getByText(/← Back/));
      expect(onBack).toHaveBeenCalledOnce();
    });
  });

  describe('input state — with currentFlow', () => {
    it('shows badge with current flow title', () => {
      render(
        <DiffPhase currentFlow={makeFlow({ title: 'My Current Flow' })} onBack={onBack} />
      );
      expect(screen.getByText(/Using current flow: My Current Flow/)).toBeInTheDocument();
    });

    it('shows only one textarea (after) when currentFlow is provided', () => {
      render(<DiffPhase currentFlow={makeFlow()} onBack={onBack} />);
      expect(screen.getAllByRole('textbox').length).toBe(1);
    });

    it('disables Compare button when right (after) input is empty', () => {
      render(<DiffPhase currentFlow={makeFlow()} onBack={onBack} />);
      expect(screen.getByText('Compare Flows')).toBeDisabled();
    });

    it('enables Compare button when after input has content', async () => {
      const user = userEvent.setup();
      render(<DiffPhase currentFlow={makeFlow()} onBack={onBack} />);
      await user.type(screen.getByRole('textbox'), 'after content');
      expect(screen.getByText('Compare Flows')).not.toBeDisabled();
    });
  });

  describe('parse error handling', () => {
    it('shows error message when parseFlow rejects', async () => {
      vi.mocked(parseFlow).mockRejectedValueOnce(new Error('Invalid JSON'));
      const user = userEvent.setup();
      render(<DiffPhase currentFlow={makeFlow()} onBack={onBack} />);
      await user.type(screen.getByRole('textbox'), 'bad content');
      await user.click(screen.getByText('Compare Flows'));
      expect(await screen.findByText(/Parse error: Invalid JSON/)).toBeInTheDocument();
    });

    it('shows Parsing... label during async parse', async () => {
      let resolve!: (v: Flow) => void;
      vi.mocked(parseFlow).mockReturnValueOnce(new Promise((r) => (resolve = r)));
      const user = userEvent.setup();
      render(<DiffPhase currentFlow={makeFlow()} onBack={onBack} />);
      await user.type(screen.getByRole('textbox'), 'content');
      await user.click(screen.getByText('Compare Flows'));
      expect(screen.getByText('Parsing...')).toBeInTheDocument();
      resolve(makeFlow());
    });
  });

  describe('result state', () => {
    it('shows NO CHANGES when both flows are identical', async () => {
      const flow = makeFlow({ title: 'Flow A' });
      vi.mocked(parseFlow).mockResolvedValue(flow);
      const user = userEvent.setup();
      await driveToResult(user, flow);
      expect(await screen.findByText('NO CHANGES')).toBeInTheDocument();
    });

    it('shows change count when flows differ', async () => {
      vi.mocked(parseFlow).mockResolvedValue(makeFlow({ title: 'Flow B' }));
      const user = userEvent.setup();
      await driveToResult(user, makeFlow({ title: 'Flow A' }));
      expect(await screen.findByText(/1 change/)).toBeInTheDocument();
    });

    it('shows flow titles in the diff header', async () => {
      vi.mocked(parseFlow).mockResolvedValue(makeFlow({ title: 'Version 2' }));
      const user = userEvent.setup();
      await driveToResult(user, makeFlow({ title: 'Version 1' }));
      await screen.findByText('DIFF');
      expect(document.body.textContent).toContain('Version 1');
      expect(document.body.textContent).toContain('Version 2');
    });

    it('shows DIFF label in result header', async () => {
      const flow = makeFlow({ title: 'Flow A' });
      vi.mocked(parseFlow).mockResolvedValue(flow);
      const user = userEvent.setup();
      await driveToResult(user, flow);
      expect(await screen.findByText('DIFF')).toBeInTheDocument();
    });

    it('clicking New Diff returns to input state', async () => {
      const flow = makeFlow({ title: 'Flow A' });
      vi.mocked(parseFlow).mockResolvedValue(flow);
      const user = userEvent.setup();
      await driveToResult(user, flow);
      await user.click(await screen.findByText(/New Diff/));
      expect(screen.getByText('Compare flows')).toBeInTheDocument();
    });

    it('clicking Back in result state calls onBack', async () => {
      const flow = makeFlow({ title: 'Flow A' });
      vi.mocked(parseFlow).mockResolvedValue(flow);
      const user = userEvent.setup();
      await driveToResult(user, flow);
      await screen.findByText('DIFF');
      const backBtns = screen.getAllByText(/← Back/);
      await user.click(backBtns[backBtns.length - 1]!);
      expect(onBack).toHaveBeenCalledOnce();
    });

    it('shows modified summary badge when a field changes', async () => {
      vi.mocked(parseFlow).mockResolvedValue(
        makeFlow({ title: 'Same', description: 'New' })
      );
      const user = userEvent.setup();
      await driveToResult(user, makeFlow({ title: 'Same' }));
      await screen.findByText('DIFF');
      expect(screen.getByText(/modified/i)).toBeInTheDocument();
    });
  });
});
