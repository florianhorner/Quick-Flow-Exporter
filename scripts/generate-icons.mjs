/**
 * Generate simple PNG icons for the browser extension.
 * Creates a cyan lightning bolt on a dark background at 16x16, 48x48, and 128x128.
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '..', 'extension', 'icons');

// Minimal PNG encoder for simple RGBA images
function createPNG(width, height, pixels) {
  // pixels is a Uint8Array of RGBA values (width * height * 4)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT chunk - raw pixel data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
      rawData[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }

  const compressed = deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

// CRC32 implementation for PNG
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crc32Table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crc32Table[i] = c;
}

// Draw a simple icon: dark rounded rect with cyan "QF" text
function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  // Background: #0f172a (midnight-900)
  const bgR = 15,
    bgG = 23,
    bgB = 42;
  // Accent: #06b6d4 (cyan-500)
  const acR = 6,
    acG = 182,
    acB = 212;

  const radius = Math.round(size * 0.2);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Rounded rectangle check
      const inRect = isInRoundedRect(x, y, 0, 0, size, size, radius);

      if (inRect) {
        // Draw a simple lightning bolt shape
        const nx = x / size; // normalized 0-1
        const ny = y / size;

        if (isLightningBolt(nx, ny)) {
          pixels[idx] = acR;
          pixels[idx + 1] = acG;
          pixels[idx + 2] = acB;
          pixels[idx + 3] = 255;
        } else {
          pixels[idx] = bgR;
          pixels[idx + 1] = bgG;
          pixels[idx + 2] = bgB;
          pixels[idx + 3] = 255;
        }
      } else {
        // Transparent
        pixels[idx + 3] = 0;
      }
    }
  }

  return pixels;
}

function isInRoundedRect(px, py, rx, ry, rw, rh, r) {
  // Check if point is inside rounded rectangle
  if (px < rx || px >= rx + rw || py < ry || py >= ry + rh) return false;

  // Check corners
  const corners = [
    [rx + r, ry + r],
    [rx + rw - r, ry + r],
    [rx + r, ry + rh - r],
    [rx + rw - r, ry + rh - r],
  ];

  for (const [cx, cy] of corners) {
    const inCornerRegion =
      (px < rx + r || px >= rx + rw - r) && (py < ry + r || py >= ry + rh - r);
    if (inCornerRegion) {
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy > r * r) return false;
    }
  }
  return true;
}

function isLightningBolt(nx, ny) {
  // Simple lightning bolt shape using polygon test
  // Bolt shape: top-right to center, then center-left to bottom-right
  const bolt = [
    // Upper part (going right to left downward)
    { x: 0.55, y: 0.12 },
    { x: 0.3, y: 0.48 },
    { x: 0.5, y: 0.48 },
    // Lower part (going left to right downward)
    { x: 0.35, y: 0.88 },
    { x: 0.65, y: 0.48 },
    { x: 0.48, y: 0.48 },
    { x: 0.7, y: 0.12 },
  ];

  return isPointInPolygon(nx, ny, bolt);
}

function isPointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Generate icons at all sizes
const sizes = [16, 48, 128];

for (const size of sizes) {
  const pixels = drawIcon(size);
  const png = createPNG(size, size, pixels);
  const path = resolve(iconsDir, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`Generated ${path} (${size}x${size})`);
}
