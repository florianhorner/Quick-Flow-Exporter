import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const NODE_ENGINE_RANGE = '^22.22.2 || ^24.15.0 || >=26.0.0';

export function isSupportedNodeVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return false;
  const [, major, minor, patch] = match.map(Number);
  return (
    (major === 22 && (minor > 22 || (minor === 22 && patch >= 2))) ||
    (major === 24 && minor >= 15) ||
    major >= 26
  );
}

export function checkNodeVersion(version = process.versions.node) {
  const manifest = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );
  if (manifest.engines.node !== NODE_ENGINE_RANGE) {
    throw new Error('Node version check and package engine range must match');
  }
  if (!isSupportedNodeVersion(version)) {
    throw new Error(`Node ${version} is unsupported; use ${NODE_ENGINE_RANGE}`);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  checkNodeVersion();
}
