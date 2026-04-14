import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCard from '../GroupCard';
import type { Group, Step } from '../../types';

function makeStep(id: string, title: string): Step {
  return {
    id,
    type: 'general_knowledge',
    title,
    prompt: '',
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

function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 'group-1',
    isGroup: true,
    title: 'My Group',
    runCondition: 'Once',
    reasoningInstructions: 'Run this group once',
    steps: [],
    ...overrides,
  };
}

const defaultCallbacks = {
  onChange: vi.fn(),
  onRemove: vi.fn(),
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
};

describe('GroupCard', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('rendering', () => {
    it('renders the group title', () => {
      render(
        <GroupCard
          group={makeGroup()}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      expect(screen.getByText('My Group')).toBeInTheDocument();
    });

    it('shows "Reasoning Group" fallback when title is empty', () => {
      render(
        <GroupCard
          group={makeGroup({ title: '' })}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      expect(screen.getByText('Reasoning Group')).toBeInTheDocument();
    });

    it('shows step count in the header', () => {
      const steps = [makeStep('s1', 'Step A'), makeStep('s2', 'Step B')];
      render(
        <GroupCard
          group={makeGroup({ steps })}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      expect(screen.getByText('(2 steps)')).toBeInTheDocument();
    });

    it('does not render editable fields when collapsed', () => {
      render(
        <GroupCard
          group={makeGroup()}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      expect(screen.queryByPlaceholderText('Group Title')).not.toBeInTheDocument();
    });
  });

  describe('expand / collapse', () => {
    it('shows editable fields after clicking the header', async () => {
      const user = userEvent.setup();
      render(
        <GroupCard
          group={makeGroup()}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      await user.click(screen.getByRole('button', { expanded: false }));
      expect(screen.getByPlaceholderText('Group Title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Reasoning Instructions')).toBeInTheDocument();
    });
  });

  describe('editing when expanded', () => {
    async function expandGroup() {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { rerender } = render(
        <GroupCard
          group={makeGroup()}
          {...defaultCallbacks}
          onChange={onChange}
          isFirst={false}
          isLast={false}
        />
      );
      await user.click(screen.getByRole('button', { expanded: false }));
      return { user, onChange, rerender };
    }

    it('calls onChange with updated title when title input changes', async () => {
      const { user, onChange } = await expandGroup();
      const titleInput = screen.getByPlaceholderText('Group Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'New Name');
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining('N') })
      );
    });

    it('calls onChange with updated run condition when select changes', async () => {
      const { user, onChange } = await expandGroup();
      const select = screen.getByLabelText(/Run condition/i);
      await user.selectOptions(select, 'Validate');
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ runCondition: 'Validate' })
      );
    });

    it('calls onChange with updated reasoning instructions', async () => {
      const { user, onChange } = await expandGroup();
      const textarea = screen.getByPlaceholderText('Reasoning Instructions');
      await user.clear(textarea);
      await user.type(textarea, 'Skip if done');
      expect(onChange).toHaveBeenCalled();
    });

    it('adds a step when + Step is clicked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <GroupCard
          group={makeGroup({ steps: [] })}
          {...defaultCallbacks}
          onChange={onChange}
          isFirst={false}
          isLast={false}
        />
      );
      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByText('+ Step'));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ steps: expect.arrayContaining([expect.any(Object)]) })
      );
      const call = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as Group;
      expect(call.steps).toHaveLength(1);
    });
  });

  describe('step management within group', () => {
    it('renders child StepCards for each step in the group', async () => {
      const user = userEvent.setup();
      const steps = [makeStep('s1', 'Alpha'), makeStep('s2', 'Beta')];
      render(
        <GroupCard
          group={makeGroup({ steps })}
          {...defaultCallbacks}
          isFirst={false}
          isLast={false}
        />
      );
      await user.click(screen.getByRole('button', { expanded: false }));
      const list = screen.getByRole('list', { name: 'Group steps' });
      expect(within(list).getAllByRole('listitem')).toHaveLength(2);
      expect(within(list).getByText('Alpha')).toBeInTheDocument();
      expect(within(list).getByText('Beta')).toBeInTheDocument();
    });

    it('removes a step from the group when the step remove button is clicked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      const steps = [makeStep('s1', 'Alpha'), makeStep('s2', 'Beta')];
      render(
        <GroupCard
          group={makeGroup({ steps })}
          {...defaultCallbacks}
          onChange={onChange}
          isFirst={false}
          isLast={false}
        />
      );
      await user.click(screen.getByRole('button', { expanded: false }));
      // Remove first step (Alpha)
      await user.click(screen.getByLabelText(/Remove Alpha/i));
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as Group;
      expect(lastCall.steps).toHaveLength(1);
      expect(lastCall.steps[0]!.title).toBe('Beta');
    });
  });

  describe('move and remove group', () => {
    it('calls onMoveUp when the group up button is clicked', async () => {
      const onMoveUp = vi.fn();
      const user = userEvent.setup();
      render(
        <GroupCard
          group={makeGroup()}
          {...defaultCallbacks}
          onMoveUp={onMoveUp}
          isFirst={false}
          isLast={false}
        />
      );
      await user.click(screen.getByLabelText(/Move My Group up/i));
      expect(onMoveUp).toHaveBeenCalledOnce();
    });

    it('calls onRemove when the group × button is clicked', async () => {
      const onRemove = vi.fn();
      const user = userEvent.setup();
      render(
        <GroupCard
          group={makeGroup()}
          {...defaultCallbacks}
          onRemove={onRemove}
          isFirst={false}
          isLast={false}
        />
      );
      await user.click(screen.getByLabelText(/Remove My Group/i));
      expect(onRemove).toHaveBeenCalledOnce();
    });
  });
});
