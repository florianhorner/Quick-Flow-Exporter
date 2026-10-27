import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkVersion } from './check-version.mjs';

test('version guard rejects manifest and lockfile version drift', () => {
  const directory = mkdtempSync(join(tmpdir(), 'version-check-'));
  const manifest = { name: 'version-fixture', version: '1.0.0' };
  const lock = {
    name: manifest.name,
    version: '1.0.0',
    lockfileVersion: 3,
    packages: { '': manifest },
  };
  const check = (pkg, candidate) => {
    writeFileSync(join(directory, 'package.json'), JSON.stringify(pkg));
    writeFileSync(join(directory, 'package-lock.json'), JSON.stringify(candidate));
    checkVersion(directory);
  };
  try {
    assert.doesNotThrow(() => check(manifest, lock));
    for (const [pkg, candidate] of [
      [{ ...manifest, version: '1.0.1' }, lock],
      [manifest, { ...lock, version: '1.0.1' }],
      [manifest, { ...lock, packages: { '': { ...manifest, version: '1.0.1' } } }],
      [manifest, { ...lock, packages: {} }],
      [
        { ...manifest, version: '' },
        { ...lock, version: '' },
      ],
    ]) {
      assert.throws(() => check(pkg, candidate), /must match/);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('release workflow updates and stages all package versions without dependency drift', () => {
  const directory = mkdtempSync(join(tmpdir(), 'release-version-'));
  const workflow = readFileSync(
    new URL('../.github/workflows/release.yml', import.meta.url),
    'utf8'
  ).replace(/\r\n/g, '\n');
  const updateStep = workflow.split('      - name: Update package versions\n')[1];
  assert(updateStep, 'Release workflow must update package versions');
  const run = updateStep.split('\n      - name: ')[0].split('        run: |\n')[1];
  assert(run, 'Release version step must have a runnable body');
  const updateCommand = run
    .trimEnd()
    .split('\n')
    .map((line) => line.slice(10))
    .join('\n');
  const stageCommand = workflow.match(/^          git add .+$/m)?.[0].trim();
  assert(stageCommand, 'Release workflow must stage its changes');
  const manifest = {
    name: 'version-fixture',
    version: '1.0.0',
    scripts: {
      'check:version': 'node scripts/check-version.mjs',
      preversion: 'node -e "throw new Error(\'Release must skip lifecycle hooks\')"',
    },
    dependencies: { example: '1.0.0' },
  };
  const dependency = {
    version: '1.0.0',
    resolved: 'https://registry.npmjs.org/example/-/example-1.0.0.tgz',
  };
  const lock = {
    name: manifest.name,
    version: '1.0.0',
    lockfileVersion: 3,
    packages: { '': manifest, 'node_modules/example': dependency },
  };
  try {
    mkdirSync(join(directory, 'scripts'));
    writeFileSync(
      join(directory, 'scripts/check-version.mjs'),
      readFileSync(new URL('./check-version.mjs', import.meta.url))
    );
    writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest));
    writeFileSync(join(directory, 'package-lock.json'), JSON.stringify(lock));
    writeFileSync(join(directory, 'CHANGELOG.md'), '# Changelog\n');
    for (const line of updateCommand.split('\n')) {
      const [command, ...args] = line.trim().split(/\s+/);
      assert.equal(command, 'npm');
      execFileSync(
        process.execPath,
        [
          process.env.npm_execpath,
          ...args.map((argument) => (argument === '"$NEW_VERSION"' ? '1.0.1' : argument)),
        ],
        { cwd: directory, stdio: 'pipe' }
      );
    }
    checkVersion(directory);
    const updated = JSON.parse(
      readFileSync(join(directory, 'package-lock.json'), 'utf8')
    );
    assert.equal(updated.version, '1.0.1');
    assert.deepEqual(updated.packages['node_modules/example'], dependency);
    assert.deepEqual(updated.packages[''].dependencies, manifest.dependencies);
    execFileSync('git', ['init', '-q', directory], { stdio: 'pipe' });
    const [git, ...stageArgs] = stageCommand.split(/\s+/);
    assert.equal(git, 'git');
    execFileSync(git, stageArgs, { cwd: directory, stdio: 'pipe' });
    assert.deepEqual(
      execFileSync('git', ['diff', '--cached', '--name-only'], {
        cwd: directory,
        encoding: 'utf8',
      })
        .trim()
        .split(/\r?\n/),
      ['CHANGELOG.md', 'package-lock.json', 'package.json']
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
