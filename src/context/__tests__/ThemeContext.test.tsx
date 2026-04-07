import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../ThemeContext';

function ThemeConsumer() {
  const { mode, resolved, toggle, setMode } = useTheme();
  return (
    <>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolved}</span>
      <button onClick={toggle}>Toggle</button>
      <button onClick={() => setMode('light')}>Set Light</button>
    </>
  );
}

function mockMatchMedia(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('dark') ? prefersDark : !prefersDark,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    mockMatchMedia(false);
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    vi.unstubAllGlobals();
  });

  it('defaults to dark mode when nothing in localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('reads stored light theme from localStorage', () => {
    localStorage.setItem('qfe-theme', 'light');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(screen.getByTestId('resolved').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setMode persists to localStorage and updates document class', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    await user.click(screen.getByText('Set Light'));
    expect(localStorage.getItem('qfe-theme')).toBe('light');
    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggle cycles dark → system → light → dark', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    await user.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('system');
    await user.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('light');
    await user.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it.each([
    [true, 'dark', true],
    [false, 'light', false],
  ])(
    'system mode resolves correctly when OS prefersDark=%s',
    (prefersDark, expectedResolved, expectDarkClass) => {
      mockMatchMedia(prefersDark);
      localStorage.setItem('qfe-theme', 'system');
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );
      expect(screen.getByTestId('resolved').textContent).toBe(expectedResolved);
      expect(document.documentElement.classList.contains('dark')).toBe(expectDarkClass);
    }
  );

  it('useTheme throws when used outside ThemeProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeConsumer />)).toThrow(
      'useTheme must be used within ThemeProvider'
    );
    consoleSpy.mockRestore();
  });

  it('ignores invalid values in localStorage and falls back to dark', () => {
    localStorage.setItem('qfe-theme', 'rainbow');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });
});
