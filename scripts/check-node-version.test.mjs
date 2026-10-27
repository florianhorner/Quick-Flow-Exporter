import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  NODE_ENGINE_RANGE,
  checkNodeVersion,
  isSupportedNodeVersion,
} from './check-node-version.mjs';

test('supported Node release boundaries match the declared runtime range', () => {
  for (const version of [
    '22.22.2',
    'v22.23.0',
    '24.15.0',
    '24.16.0',
    '26.0.0',
    '27.0.0',
  ]) {
    assert.equal(isSupportedNodeVersion(version), true, version);
    assert.doesNotThrow(() => checkNodeVersion(version));
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
    assert.throws(() => checkNodeVersion(version), /unsupported/);
  }
});

test('Node checker and package engine declaration remain synchronized', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  assert.equal(manifest.engines.node, NODE_ENGINE_RANGE);
  assert.doesNotThrow(() => checkNodeVersion());
});

test('ordinary npm installation rejects unsupported engines without an extra flag', () => {
  const directory = mkdtempSync(join(tmpdir(), 'node-engine-check-'));
  try {
    writeFileSync(
      join(directory, '.npmrc'),
      readFileSync(new URL('../.npmrc', import.meta.url))
    );
    for (const [node, expected] of [
      ['<0', false],
      [NODE_ENGINE_RANGE, true],
    ]) {
      writeFileSync(
        join(directory, 'package.json'),
        JSON.stringify({ name: 'engine-fixture', version: '1.0.0', engines: { node } })
      );
      const result = spawnSync(
        process.execPath,
        [
          process.env.npm_execpath,
          'install',
          '--package-lock-only',
          '--ignore-scripts',
          '--offline',
        ],
        { cwd: directory, encoding: 'utf8' }
      );
      assert.equal(result.status === 0, expected);
      if (!expected) assert.match(result.stderr, /EBADENGINE/);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
