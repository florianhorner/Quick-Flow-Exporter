import { execFileSync } from 'node:child_process';
import { lstatSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const privateDirectories = new Set([
  '.context',
  '.gstack',
  '.playwright-cli',
  '.steamroll',
  'plan',
  'plans',
  'todo',
  'todos',
  'retro',
  'retros',
  'retrospective',
  'retrospectives',
  'proof',
]);
const sourceExtension = /\.(ts|tsx|js|jsx|mjs|cjs|css|scss|sh)$/i;
const workingNote =
  /(^|[._ -])(todos?|plans?|retro(?:spective)?s?|agent[._ -]+sessions?|session[._ -]+(?:records?|logs?|transcripts?)|execution[._ -]+(?:receipts?|records?|logs?))([._ -]|$)/i;

export function isPrivateWorkingFile(filename) {
  const parts = filename.normalize('NFKC').toLowerCase().split('/');
  return (
    parts
      .slice(0, -1)
      .some((part) => privateDirectories.has(part) || workingNote.test(part)) ||
    (!sourceExtension.test(parts.at(-1)) && workingNote.test(parts.at(-1)))
  );
}

export function checkPublicFiles(repo, { staged = false } = {}) {
  const args = ['-C', repo, 'ls-files', '-z', '--cached'];
  if (!staged) args.push('--others', '--exclude-standard');
  const files = execFileSync('git', args, { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
  return [...new Set(files)].filter((filename) => {
    if (!isPrivateWorkingFile(filename)) return false;
    if (staged) return true;
    try {
      lstatSync(path.join(repo, filename));
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--staged') || args.length > 1) {
    console.error('Usage: node scripts/check-public-files.mjs [--staged]');
    process.exitCode = 2;
  } else {
    try {
      const rejected = checkPublicFiles(process.cwd(), {
        staged: args.includes('--staged'),
      });
      if (rejected.length) {
        console.error(
          'Keep working notes in ignored local storage, outside the published files:'
        );
        for (const filename of rejected) console.error(`  ${JSON.stringify(filename)}`);
        process.exitCode = 1;
      } else {
        console.log('Public file admission check passed.');
      }
    } catch (error) {
      console.error(`Public file admission check failed: ${error.message}`);
      process.exitCode = 2;
    }
  }
}
