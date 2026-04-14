import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepCard from '../StepCard';
import type { Step } from '../../types';

function makeStep(overrides: Partial<Step> = {}): Step {
  return {
    id: 'step-1',
    type: 'general_knowledge',
    title: 'My Step',
    prompt: 'Do something useful',
    agentName: '',
    source: 'General knowledge',
    outputPref: 'Fast',
    creativityLevel: 5,
    placeholder: '',
    defaultValue: '',
    config: '',
    references: '',
    ...overrides,
  };
}

const defaultCallbacks = {
  onChange: vi.fn(),
  onRemove: vi.fn(),
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
};

describe('StepCard', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('rendering', () => {
    it('renders the step title in the header', () => {
      render(
        <StepCard
          step={makeStep()}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      expect(screen.getByText('My Step')).toBeInTheDocument();
    });

    it('shows untitled label when step has no title', () => {
      render(
        <StepCard
          step={makeStep({ title: '' })}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      expect(screen.getByText(/General Knowledge \(untitled\)/i)).toBeInTheDocument();
    });

    it('hides Move Up button when isFirst=true', () => {
      render(
        <StepCard step={makeStep()} {...defaultCallbacks} isFirst={true} isLast={false} />
      );
      expect(screen.queryByLabelText(/Move My Step up/i)).not.toBeInTheDocument();
    });

    it('hides Move Down button when isLast=true', () => {
      render(
        <StepCard step={makeStep()} {...defaultCallbacks} isFirst={false} isLast={true} />
      );
      expect(screen.queryByLabelText(/Move My Step down/i)).not.toBeInTheDocument();
    });

    it('shows both move buttons when isFirst=false and isLast=false', () => {
      render(
        <StepCard
          step={makeStep()}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      expect(screen.getByLabelText(/Move My Step up/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Move My Step down/i)).toBeInTheDocument();
    });

    it('does not render the step fields panel when collapsed', () => {
      render(
        <StepCard
          step={makeStep()}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      expect(
        screen.queryByRole('combobox', { name: /step type/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('expand / collapse', () => {
    it('expands to show step type select when header is clicked', async () => {
      const user = userEvent.setup();
      render(
        <StepCard
          step={makeStep()}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      // The toggle is the only role="button" element with aria-expanded
      await user.click(screen.getByRole('button', { expanded: false }));
      expect(screen.getByRole('combobox', { name: /step type/i })).toBeInTheDocument();
    });

    it('collapses the panel when header is clicked again', async () => {
      const user = userEvent.setup();
      render(
        <StepCard
          step={makeStep()}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      // expanded=false → click → expanded=true → click → collapsed again
      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByRole('button', { expanded: true }));
      expect(
        screen.queryByRole('combobox', { name: /step type/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onMoveUp when the up button is clicked', async () => {
      const onMoveUp = vi.fn();
      const user = userEvent.setup();
      render(
        <StepCard
          step={makeStep()}
          {...defaultCallbacks}
          onMoveUp={onMoveUp}
          isFirst={false}
          isLast={false}
        />
      );
      await user.click(screen.getByLabelText(/Move My Step up/i));
      expect(onMoveUp).toHaveBeenCalledOnce();
    });

    it('calls onMoveDown when the down button is clicked', async () => {
      const onMoveDown = vi.fn();
      const user = userEvent.setup();
      render(
        <StepCard
          step={makeStep()}
          {...defaultCallbacks}
          onMoveDown={onMoveDown}
          isFirst={false}
          isLast={false}
        />
      );
      await user.click(screen.getByLabelText(/Move My Step down/i));
      expect(onMoveDown).toHaveBeenCalledOnce();
    });

    it('calls onRemove when the × button is clicked', async () => {
      const onRemove = vi.fn();
      const user = userEvent.setup();
      render(
        <StepCard
          step={makeStep()}
          {...defaultCallbacks}
          onRemove={onRemove}
          isFirst={false}
          isLast={false}
        />
      );
      await user.click(screen.getByLabelText(/Remove My Step/i));
      expect(onRemove).toHaveBeenCalledOnce();
    });

    it('clicking move-up does not toggle the panel', async () => {
      const user = userEvent.setup();
      render(
        <StepCard
          step={makeStep()}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      await user.click(screen.getByLabelText(/Move My Step up/i));
      expect(
        screen.queryByRole('combobox', { name: /step type/i })
      ).not.toBeInTheDocument();
    });

    it('calls onChange with updated step type when select changes', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <StepCard
          step={makeStep()}
          {...defaultCallbacks}
          onChange={onChange}
          isFirst={false}
          isLast={false}
        />
      );
      // open the panel first using the toggle (aria-expanded)
      await user.click(screen.getByRole('button', { expanded: false }));
      const select = screen.getByRole('combobox', { name: /step type/i });
      await user.selectOptions(select, 'web_search');
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'web_search' })
      );
    });
  });
});
