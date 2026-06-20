import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupInstructionCard from '../GroupInstructionCard';
import { createEmptyGroup } from '../../lib/flow';
import { parseGroupInstructions } from '../../lib/parser';

vi.mock('../../lib/parser', () => ({
  parseGroupInstructions: vi.fn(),
}));

describe('GroupInstructionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts group instructions in local mode', async () => {
    vi.mocked(parseGroupInstructions).mockResolvedValue({
      runCondition: 'Run if true',
      reasoningInstructions: 'Use the risk review policy.',
    });
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const group = { ...createEmptyGroup(), title: 'Risk Review' };

    render(<GroupInstructionCard item={group} index={0} onUpdate={onUpdate} />);

    await user.type(screen.getByRole('textbox'), 'raw group instructions');
    await user.click(screen.getByText('Extract Instructions'));

    expect(parseGroupInstructions).toHaveBeenCalledWith('raw group instructions');
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        runCondition: 'Run if true',
        reasoningInstructions: 'Use the risk review policy.',
      })
    );
  });

  it('gates extraction in hosted demo mode', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const group = { ...createEmptyGroup(), title: 'Risk Review' };

    render(<GroupInstructionCard item={group} index={0} onUpdate={onUpdate} demoMode />);

    await user.type(screen.getByRole('textbox'), 'raw group instructions');

    expect(screen.getByText('Run locally to extract')).toBeDisabled();
    expect(parseGroupInstructions).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
