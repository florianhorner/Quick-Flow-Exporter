import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportPhase from '../ExportPhase';
import { createEmptyFlow } from '../../lib/flow';
import type { Flow } from '../../types';

function makeFlow(overrides: Partial<Flow> = {}): Flow {
  return {
    ...createEmptyFlow(),
    title: 'Test Flow',
    description: 'A test description',
    ...overrides,
  };
}

describe('ExportPhase', () => {
  const onDownload = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom doesn't implement navigator.clipboard. Install a plain object first
    // so vi.spyOn has something to wrap — restoreAllMocks can then clean up normally.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.resolve() },
      configurable: true,
      writable: true,
    });
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    // Always restore real timers so a failing fake-timer test can't affect others
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders all three format selector buttons', () => {
    render(<ExportPhase flow={makeFlow()} onDownload={onDownload} onBack={onBack} />);
    expect(screen.getByTitle('Human-readable documentation')).toBeInTheDocument();
    expect(screen.getByTitle('Flowchart diagram (GitHub/Quip)')).toBeInTheDocument();
    expect(screen.getByTitle('Canonical re-importable format')).toBeInTheDocument();
  });

  it('renders Copy and Download buttons', () => {
    render(<ExportPhase flow={makeFlow()} onDownload={onDownload} onBack={onBack} />);
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('calls onBack when Back is clicked', async () => {
    const user = userEvent.setup();
    render(<ExportPhase flow={makeFlow()} onDownload={onDownload} onBack={onBack} />);
    await user.click(screen.getByText(/← Back/));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows Mermaid hint when Mermaid format is selected', async () => {
    const user = userEvent.setup();
    render(<ExportPhase flow={makeFlow()} onDownload={onDownload} onBack={onBack} />);
    await user.click(screen.getByTitle('Flowchart diagram (GitHub/Quip)'));
    expect(screen.getByText(/Mermaid-compatible renderer/)).toBeInTheDocument();
  });

  it('does not show Mermaid hint for Markdown format (default)', () => {
    render(<ExportPhase flow={makeFlow()} onDownload={onDownload} onBack={onBack} />);
    expect(screen.queryByText(/Mermaid-compatible renderer/)).not.toBeInTheDocument();
  });

  it('does not show Mermaid hint for JSON format', async () => {
    const user = userEvent.setup();
    render(<ExportPhase flow={makeFlow()} onDownload={onDownload} onBack={onBack} />);
    await user.click(screen.getByTitle('Canonical re-importable format'));
    expect(screen.queryByText(/Mermaid-compatible renderer/)).not.toBeInTheDocument();
  });

  it('content area shows JSON when JSON format is selected', async () => {
    const user = userEvent.setup();
    const flow = makeFlow({ title: 'My Export' });
    render(<ExportPhase flow={flow} onDownload={onDownload} onBack={onBack} />);
    await user.click(screen.getByTitle('Canonical re-importable format'));
    expect(
      screen.getByText(/"title": "My Export"/, { exact: false })
    ).toBeInTheDocument();
  });

  it('default content is Markdown (contains flow title as heading)', () => {
    const flow = makeFlow({ title: 'My Markdown Flow' });
    render(<ExportPhase flow={flow} onDownload={onDownload} onBack={onBack} />);
    expect(screen.getByText(/My Markdown Flow/, { exact: false })).toBeInTheDocument();
  });

  it('copy button shows Copied! feedback after successful copy', async () => {
    const user = userEvent.setup();
    render(<ExportPhase flow={makeFlow()} onDownload={onDownload} onBack={onBack} />);
    await user.click(screen.getByText('Copy'));
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });

  it('copy button resets back to Copy after 2 seconds', async () => {
    vi.useFakeTimers();
    render(<ExportPhase flow={makeFlow()} onDownload={onDownload} onBack={onBack} />);
    await act(async () => {
      screen.getByText('Copy').click();
    });
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('download button calls onDownload', async () => {
    const user = userEvent.setup();
    render(<ExportPhase flow={makeFlow()} onDownload={onDownload} onBack={onBack} />);
    await user.click(screen.getByText('Download'));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it('download uses .md extension for Markdown format', async () => {
    const user = userEvent.setup();
    render(
      <ExportPhase
        flow={makeFlow({ title: 'My Flow' })}
        onDownload={onDownload}
        onBack={onBack}
      />
    );
    // Spy after render so React's own appendChild calls don't pollute the results
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    await user.click(screen.getByText('Download'));
    const anchor = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement;
    expect(anchor?.download).toContain('.md');
  });

  it('download creates a Blob and triggers URL.createObjectURL', async () => {
    const user = userEvent.setup();
    render(<ExportPhase flow={makeFlow()} onDownload={onDownload} onBack={onBack} />);
    await user.click(screen.getByTitle('Canonical re-importable format'));
    await user.click(screen.getByText('Download'));
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(onDownload).toHaveBeenCalledOnce();
  });
});
