import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkNodeVersion, isSupportedNodeVersion } from './check-node-version.mjs';
import { checkVersion } from './check-version.mjs';

test('Node engine boundaries match the supported runtime range', () => {
  for (const version of [
    '22.22.2',
    'v22.23.0',
    '24.15.0',
    '24.16.0',
    '26.0.0',
    '27.0.0',
  ]) {
    assert.equal(isSupportedNodeVersion(version), true, version);
  }
  for (const version of [
    '22.22.1',
    '22.21.9',
    '23.0.0',
    '24.14.0',
    '25.0.0',
    '22',
    'invalid',
    '26.0.0-rc.1',
  ]) {
    assert.equal(isSupportedNodeVersion(version), false, version);
  }
  assert.doesNotThrow(() => checkNodeVersion('22.22.2'));
  assert.throws(() => checkNodeVersion('24.14.0'), /unsupported/);
});

test('version guard rejects independent manifest and lockfile drift', () => {
  const directory = mkdtempSync(join(tmpdir(), 'version-check-'));
  const write = (manifest, lock) => {
    writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest));
    writeFileSync(join(directory, 'package-lock.json'), JSON.stringify(lock));
  };
  const manifest = { name: 'version-fixture', version: '1.0.0' };
  const lock = {
    name: manifest.name,
    version: '1.0.0',
    lockfileVersion: 3,
    packages: { '': manifest },
  };
  try {
    write(manifest, lock);
    assert.doesNotThrow(() => checkVersion(directory));
    for (const [pkg, candidate] of [
      [{ ...manifest, version: '1.0.1' }, lock],
      [manifest, { ...lock, version: '1.0.1' }],
      [manifest, { ...lock, packages: { '': { ...manifest, version: '1.0.1' } } }],
      [manifest, { ...lock, packages: {} }],
      [
        { ...manifest, version: '' },
        { ...lock, version: '', packages: { '': { ...manifest, version: '' } } },
      ],
    ]) {
      write(pkg, candidate);
      assert.throws(() => checkVersion(directory), /must match/);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('release version command updates all versions without changing dependencies', () => {
  const directory = mkdtempSync(join(tmpdir(), 'release-version-'));
  const manifest = {
    name: 'version-fixture',
    version: '1.0.0',
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
    writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest));
    writeFileSync(join(directory, 'package-lock.json'), JSON.stringify(lock));
    execFileSync(
      process.execPath,
      [
        process.env.npm_execpath,
        'version',
        '1.0.1',
        '--no-git-tag-version',
        '--ignore-scripts',
      ],
      { cwd: directory, stdio: 'pipe' }
    );
    checkVersion(directory);
    const updated = JSON.parse(
      readFileSync(join(directory, 'package-lock.json'), 'utf8')
    );
    assert.equal(updated.version, '1.0.1');
    assert.deepEqual(updated.packages['node_modules/example'], dependency);
    assert.deepEqual(updated.packages[''].dependencies, manifest.dependencies);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
