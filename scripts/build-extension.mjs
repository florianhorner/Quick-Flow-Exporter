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

// Bundle TypeScript files
await esbuild.build({
  entryPoints: [resolve(ext, 'popup/popup.ts'), resolve(ext, 'background/background.ts')],
  outdir: dist,
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  minify: process.argv.includes('--minify'),
});

// Copy static assets
cpSync(resolve(ext, 'manifest.json'), resolve(dist, 'manifest.json'));
cpSync(resolve(ext, 'popup/popup.html'), resolve(dist, 'popup/popup.html'));
cpSync(resolve(ext, 'popup/popup.css'), resolve(dist, 'popup/popup.css'));
cpSync(resolve(ext, 'icons'), resolve(dist, 'icons'), { recursive: true });

console.log('Extension built to extension/dist/');
