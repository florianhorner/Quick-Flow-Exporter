/**
 * Build script for the Quick Flow Exporter browser extension.
 * Bundles TypeScript source files into the extension/dist/ directory
 * and copies static assets (manifest, HTML, CSS, icons).
 */

import * as esbuild from 'esbuild';
import { cpSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const ext = resolve(root, 'extension');
const dist = resolve(ext, 'dist');

// Ensure dist directories exist
mkdirSync(resolve(dist, 'popup'), { recursive: true });
mkdirSync(resolve(dist, 'background'), { recursive: true });
mkdirSync(resolve(dist, 'icons'), { recursive: true });

// Resolve the exporter URL baked into the extension. localhost is a dev-only
// default; a packaged (--minify) build must point at the real deployment, so
// fail loudly rather than ship a dead localhost tab to users.
const isProd = process.argv.includes('--minify');
const exporterBaseUrl = process.env.EXPORTER_BASE_URL;
if (isProd && !exporterBaseUrl) {
  console.error(
    'EXPORTER_BASE_URL must be set for a packaged (--minify) extension build.\n' +
      'Example: EXPORTER_BASE_URL=https://quick-flow-exporter.vercel.app node scripts/build-extension.mjs --minify'
  );
  process.exit(1);
}
const resolvedExporterBaseUrl = exporterBaseUrl ?? 'http://localhost:5173';
console.log(`Exporter base URL: ${resolvedExporterBaseUrl}`);

// Bundle TypeScript files
await esbuild.build({
  entryPoints: [resolve(ext, 'popup/popup.ts'), resolve(ext, 'background/background.ts')],
  outdir: dist,
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  minify: isProd,
  define: {
    __EXPORTER_BASE_URL__: JSON.stringify(resolvedExporterBaseUrl),
  },
});

// Copy static assets
cpSync(resolve(ext, 'manifest.json'), resolve(dist, 'manifest.json'));
cpSync(resolve(ext, 'popup/popup.html'), resolve(dist, 'popup/popup.html'));
cpSync(resolve(ext, 'popup/popup.css'), resolve(dist, 'popup/popup.css'));
cpSync(resolve(ext, 'icons'), resolve(dist, 'icons'), { recursive: true });

console.log('Extension built to extension/dist/');
