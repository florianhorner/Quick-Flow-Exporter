export const DEFAULT_EXPORTER_BASE_URL = 'http://localhost:5173';

declare const __EXPORTER_BASE_URL__: string | undefined;

export function normalizeExporterBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim();
  return (trimmed || DEFAULT_EXPORTER_BASE_URL).replace(/\/+$/, '');
}

export const EXPORTER_BASE_URL = normalizeExporterBaseUrl(
  typeof __EXPORTER_BASE_URL__ === 'undefined' ? undefined : __EXPORTER_BASE_URL__
);
