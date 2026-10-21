import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { checkPublicFiles, isPrivateWorkingFile } from './check-public-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const checker = path.join(root, 'scripts/check-public-files.mjs');

function repository(t) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'public-files-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  execFileSync('git', ['init', '--quiet', dir]);
  return dir;
}

function write(repo, filename, contents = 'Synthetic test content\n') {
  const target = path.join(repo, filename);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

test('rejects working-note variants without rejecting product documentation or source', () => {
  for (const name of [
    'TODO.md',
    'TODO',
    'TODO.html',
    'PLAN.pdf',
    'docs/TODO.markdown',
    'docs/todos.txt',
    'docs/plan/notes.md',
    'docs/todo/notes.txt',
    'docs/retrospectives/run.md',
    'working-plans/task.md',
    'docs/security-fix-plan.md',
    'PLAN.MD',
    'RETROSPECTIVE.md',
    'docs/plans/release.md',
    '.context/notes.md',
    'proof/run.txt',
    '.gstack/review.json',
  ]) {
    assert.equal(isPrivateWorkingFile(name), true, name);
  }
  for (const name of [
    'README.md',
    'docs/ARCHITECTURE.md',
    'docs/AI_PROXY_SETUP.md',
    'CHANGELOG.md',
    'AGENTS.md',
    'src/components/Plan.tsx',
    'src/data/examples.ts',
    'package-lock.json',
    'docs/explanation.md',
  ]) {
    assert.equal(isPrivateWorkingFile(name), false, name);
  }
});

test('ignored local notes are allowed; a force-added note is rejected from the index', (t) => {
  const repo = repository(t);
  write(repo, '.gitignore', '.context/\nTODO.md\n');
  write(repo, '.context/notes.md');
  write(repo, 'TODO.md');
  write(repo, 'README.md');
  execFileSync('git', ['-C', repo, 'add', '.gitignore', 'README.md']);
  assert.deepEqual(checkPublicFiles(repo), []);
  assert.deepEqual(checkPublicFiles(repo, { staged: true }), []);
  execFileSync('git', ['-C', repo, 'add', '--force', 'TODO.md']);
  assert.deepEqual(checkPublicFiles(repo, { staged: true }), ['TODO.md']);
  assert.equal(
    spawnSync(process.execPath, [checker, '--staged'], { cwd: repo }).status,
    1
  );
});

test('an unstaged deletion cannot hide an indexed note, while a staged deletion clears it', (t) => {
  const repo = repository(t);
  write(repo, 'PLAN.md');
  execFileSync('git', ['-C', repo, 'add', 'PLAN.md']);
  rmSync(path.join(repo, 'PLAN.md'));
  assert.deepEqual(checkPublicFiles(repo), []);
  assert.deepEqual(checkPublicFiles(repo, { staged: true }), ['PLAN.md']);
  execFileSync('git', ['-C', repo, 'update-index', '--force-remove', 'PLAN.md']);
  assert.deepEqual(checkPublicFiles(repo, { staged: true }), []);
});

test('untracked notes and dangling symlinks are checked before staging', (t) => {
  const repo = repository(t);
  write(repo, 'docs/design-plan.md');
  symlinkSync('missing.txt', path.join(repo, 'TODO.md'));
  assert.deepEqual(checkPublicFiles(repo).sort(), ['TODO.md', 'docs/design-plan.md']);
});

test('invalid usage and unreadable Git state fail closed', (t) => {
  const repo = repository(t);
  assert.equal(spawnSync(process.execPath, [checker, '--skip'], { cwd: repo }).status, 2);
  rmSync(path.join(repo, '.git'), { recursive: true });
  assert.equal(spawnSync(process.execPath, [checker], { cwd: repo }).status, 2);
});

test('vendored validator rejects generic operator attribution and accepts engineering reasons', (t) => {
  const repo = repository(t);
  const messageFile = path.join(repo, 'message.txt');
  const validate = (message) => {
    writeFileSync(messageFile, message);
    return spawnSync(
      'bash',
      [path.join(root, '.config/commit-lint/commit-msg'), messageFile],
      {
        encoding: 'utf8',
      }
    );
  };
  for (const body of [
    'ExampleUser asked me to fix it.',
    'As requested, fix it.',
    'Per my request.',
  ]) {
    const result = validate(`fix: handle empty input\n\n${body}\n`);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /OPERATOR_ATTRIBUTION/);
  }
  assert.equal(
    validate('fix: handle empty input\n\nAvoid accessing a missing first item.\n').status,
    0
  );
  assert.equal(validate('not a conventional subject\n').status, 1);
});

test('vendored manifest matches the actual files', () => {
  const manifest = JSON.parse(
    readFileSync(path.join(root, '.config/commit-lint/MANIFEST.json'))
  );
  for (const [filename, expected] of Object.entries(manifest.files)) {
    const actual = createHash('sha256')
      .update(readFileSync(path.join(root, filename)))
      .digest('hex');
    assert.equal(actual, expected, filename);
  }
});
