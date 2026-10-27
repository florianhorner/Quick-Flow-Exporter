import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function checkVersion(directory = process.cwd()) {
  const manifest = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(resolve(directory, 'package-lock.json'), 'utf8'));
  if (
    typeof manifest.version !== 'string' ||
    !manifest.version.trim() ||
    manifest.version !== lock.version ||
    manifest.version !== lock.packages?.['']?.version
  ) {
    throw new Error('Manifest and both lockfile versions must match');
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  checkVersion();
}
