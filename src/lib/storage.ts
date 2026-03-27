import type { HistoryEntry } from "../types";
import { STORAGE_KEY_HISTORY } from "../constants";

/**
 * Persist and retrieve export history.
 *
 * Uses localStorage as a simple default. The original code relied on a
 * `window.storage` API (QuickSuite-specific). If that API is available at
 * runtime we use it; otherwise we fall back to localStorage.
 */

interface QuickSuiteStorage {
  get(key: string): Promise<{ value: string } | null>;
  set(key: string, value: string): Promise<void>;
}

function getBackend(): QuickSuiteStorage | null {
  const win = window as unknown as { storage?: QuickSuiteStorage };
  return win.storage ?? null;
}

/** Validate that parsed data actually looks like HistoryEntry[]. */
function validateHistory(data: unknown): HistoryEntry[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (item): item is HistoryEntry =>
      typeof item === "object" &&
      item !== null &&
      typeof item.title === "string" &&
      typeof item.date === "string" &&
      typeof item.stepCount === "number" &&
      Number.isFinite(item.stepCount),
  );
}

function safeParse(raw: string): HistoryEntry[] {
  try {
    return validateHistory(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const backend = getBackend();
    if (backend) {
      const result = await backend.get(STORAGE_KEY_HISTORY);
      if (result) return safeParse(result.value);
    } else {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (raw) return safeParse(raw);
    }
  } catch {
    /* storage unavailable */
  }
  return [];
}

export async function saveHistory(entries: HistoryEntry[]): Promise<void> {
  // Sanitize before persisting — strip anything unexpected
  const clean = validateHistory(entries).slice(0, 50);
  const json = JSON.stringify(clean);
  try {
    const backend = getBackend();
    if (backend) {
      await backend.set(STORAGE_KEY_HISTORY, json);
    } else {
      localStorage.setItem(STORAGE_KEY_HISTORY, json);
    }
  } catch {
    /* storage full or unavailable */
  }
}
