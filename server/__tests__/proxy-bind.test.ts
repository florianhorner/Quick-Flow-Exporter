// @vitest-environment node
import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TSX = path.join(ROOT, 'node_modules', '.bin', 'tsx');

let child: ChildProcess | undefined;

afterEach(() => {
  child?.kill();
  child = undefined;
});

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
  });
}

function startProxy(port: number, env: Record<string, string> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const baseEnv = { ...process.env };
    delete baseEnv.PROXY_HOST;
    child = spawn(TSX, ['server/proxy.ts'], {
      cwd: ROOT,
      env: { ...baseEnv, PORT: String(port), ...env },
    });
    const timer = setTimeout(() => reject(new Error('proxy did not start')), 15_000);
    child.stdout?.on('data', (d: Buffer) => {
      if (d.toString().includes('listening on')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`proxy exited early (${code})`));
    });
  });
}

function canConnect(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ host, port, timeout: 2_000 });
    sock.once('connect', () => {
      sock.destroy();
      resolve(true);
    });
    sock.once('error', () => resolve(false));
    sock.once('timeout', () => {
      sock.destroy();
      resolve(false);
    });
  });
}

const lanIp = Object.values(os.networkInterfaces())
  .flat()
  .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;

describe('proxy network binding', () => {
  it('accepts loopback and refuses the LAN address by default', async () => {
    const port = await freePort();
    await startProxy(port);
    expect(await canConnect('127.0.0.1', port)).toBe(true);
    if (lanIp) expect(await canConnect(lanIp, port)).toBe(false);
  }, 30_000);

  it.skipIf(!lanIp)(
    'is reachable on the LAN address with PROXY_HOST=0.0.0.0',
    async () => {
      const port = await freePort();
      await startProxy(port, { PROXY_HOST: '0.0.0.0' });
      expect(await canConnect(lanIp!, port)).toBe(true);
    },
    30_000
  );
});
