import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PastePhase from '../PastePhase';
import type { HistoryEntry } from '../../types';

vi.mock('../BookmarkletPanel', () => ({
  default: () => <div data-testid="bookmarklet-panel" />,
}));

const defaultProps = {
  raw: '',
  onRawChange: vi.fn(),
  onParse: vi.fn(),
  parsing: false,
  parseError: null,
  history: [] as HistoryEntry[],
};

describe('PastePhase', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the paste heading and textarea', () => {
    render(<PastePhase {...defaultProps} />);
    expect(screen.getByText('Paste your flow')).toBeInTheDocument();
    expect(screen.getByLabelText('Paste your flow content')).toBeInTheDocument();
  });

  it('calls onRawChange when typing in the textarea', async () => {
    const user = userEvent.setup();
    const onRawChange = vi.fn();
    render(<PastePhase {...defaultProps} onRawChange={onRawChange} />);
    await user.type(screen.getByLabelText('Paste your flow content'), 'hello');
    expect(onRawChange).toHaveBeenCalled();
    expect(onRawChange.mock.calls[0]![0]).toBe('h');
  });

  it('disables Parse button when textarea is empty', () => {
    render(<PastePhase {...defaultProps} raw="" />);
    expect(screen.getByText('Parse & Extract')).toBeDisabled();
  });

  it('enables Parse button when textarea has content', () => {
    render(<PastePhase {...defaultProps} raw="some flow content" />);
    expect(screen.getByText('Parse & Extract')).not.toBeDisabled();
  });

  it('shows Parsing... label when parsing prop is true', () => {
    render(<PastePhase {...defaultProps} parsing={true} raw="content" />);
    expect(screen.getByText('Parsing...')).toBeInTheDocument();
  });

  it('shows parse error in alert when parseError is set', () => {
    render(<PastePhase {...defaultProps} parseError="Something went wrong" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('shows API key prompt when no key stored and Parse is clicked', async () => {
    const user = userEvent.setup();
    render(<PastePhase {...defaultProps} raw="some content" />);
    await user.click(screen.getByText('Parse & Extract'));
    expect(screen.getByText('Configure AI provider')).toBeInTheDocument();
  });

  it('does not show API key prompt when key is already stored', async () => {
    sessionStorage.setItem('qf-api-key', 'sk-test-key');
    const user = userEvent.setup();
    render(<PastePhase {...defaultProps} raw="some content" />);
    await user.click(screen.getByText('Parse & Extract'));
    expect(screen.queryByText('Configure AI provider')).not.toBeInTheDocument();
  });

  it('calls onParse directly when API key is already stored', async () => {
    sessionStorage.setItem('qf-api-key', 'sk-test-key');
    const user = userEvent.setup();
    const onParse = vi.fn();
    render(<PastePhase {...defaultProps} raw="some content" onParse={onParse} />);
    await user.click(screen.getByText('Parse & Extract'));
    expect(onParse).toHaveBeenCalledOnce();
  });

  it('saves key and calls onParse when Save & Parse is clicked', async () => {
    const user = userEvent.setup();
    const onParse = vi.fn();
    render(<PastePhase {...defaultProps} raw="some content" onParse={onParse} />);
    await user.click(screen.getByText('Parse & Extract'));
    await user.type(screen.getByPlaceholderText('sk-ant-...'), 'my-new-key');
    await user.click(screen.getByText('Save & Parse'));
    expect(sessionStorage.getItem('qf-api-key')).toBe('my-new-key');
    expect(onParse).toHaveBeenCalledOnce();
  });

  it('Save & Parse button is disabled when key input is empty', async () => {
    const user = userEvent.setup();
    render(<PastePhase {...defaultProps} raw="some content" />);
    await user.click(screen.getByText('Parse & Extract'));
    expect(screen.getByText('Save & Parse')).toBeDisabled();
  });

  it('shows Recent Exports heading when history is non-empty', () => {
    const history: HistoryEntry[] = [
      { title: 'My Flow', date: '2024-01-01T00:00:00.000Z', stepCount: 5 },
    ];
    render(<PastePhase {...defaultProps} history={history} />);
    expect(screen.getByText('Recent Exports')).toBeInTheDocument();
  });

  it('renders history entry titles and step counts', () => {
    const history: HistoryEntry[] = [
      { title: 'My Flow', date: '2024-01-01T00:00:00.000Z', stepCount: 5 },
      { title: 'Another Flow', date: '2024-01-02T00:00:00.000Z', stepCount: 3 },
    ];
    render(<PastePhase {...defaultProps} history={history} />);
    expect(screen.getByText('My Flow')).toBeInTheDocument();
    expect(screen.getByText('Another Flow')).toBeInTheDocument();
    expect(screen.getByText(/5 steps/)).toBeInTheDocument();
    expect(screen.getByText(/3 steps/)).toBeInTheDocument();
  });

  it('does not show Recent Exports when history is empty', () => {
    render(<PastePhase {...defaultProps} history={[]} />);
    expect(screen.queryByText('Recent Exports')).not.toBeInTheDocument();
  });

  it('shows only up to 5 history entries', () => {
    const history: HistoryEntry[] = Array.from({ length: 8 }, (_, i) => ({
      title: `Flow ${i}`,
      date: '2024-01-01T00:00:00.000Z',
      stepCount: i,
    }));
    render(<PastePhase {...defaultProps} history={history} />);
    expect(screen.getAllByText(/^Flow \d$/).length).toBe(5);
  });

  it('shows char count when raw has content', () => {
    render(<PastePhase {...defaultProps} raw="hello" />);
    expect(screen.getByText('5 chars')).toBeInTheDocument();
  });

  it('shows "Set API key" link when no key is stored', () => {
    render(<PastePhase {...defaultProps} />);
    expect(screen.getByText('Set API key')).toBeInTheDocument();
  });

  it('shows "Settings" link when API key is already stored', () => {
    sessionStorage.setItem('qf-api-key', 'sk-existing');
    render(<PastePhase {...defaultProps} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders all provider options in the provider selector', async () => {
    const user = userEvent.setup();
    render(<PastePhase {...defaultProps} raw="content" />);
    await user.click(screen.getByText('Parse & Extract'));
    expect(screen.getByLabelText('Provider')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Anthropic/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /OpenAI/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Gemini/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Perplexity/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Bedrock/ })).toBeInTheDocument();
  });

  it('shows Bedrock note instead of key input when Bedrock is selected', async () => {
    const user = userEvent.setup();
    render(<PastePhase {...defaultProps} raw="content" />);
    await user.click(screen.getByText('Parse & Extract'));
    await user.selectOptions(screen.getByLabelText('Provider'), 'bedrock');
    expect(screen.queryByPlaceholderText('sk-ant-...')).not.toBeInTheDocument();
    expect(screen.getByText(/server-side AWS credentials/i)).toBeInTheDocument();
  });

  it('renders a feedback link to the issue chooser', () => {
    render(<PastePhase {...defaultProps} />);
    const link = screen.getByRole('link', {
      name: /report a bug \/ share feedback/i,
    });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/florianhorner/Quick-Flow-Exporter/issues/new/choose'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
