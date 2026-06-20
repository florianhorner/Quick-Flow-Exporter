# Browser Extension (Chrome / Edge)

[&larr; Back to README](../README.md)

A Manifest V3 browser extension for one-click flow extraction — no bookmarklet needed.

## Install (developer mode)

1. Build the extension:
   ```bash
   npm run build:extension
   ```
2. Open `chrome://extensions` (or `edge://extensions`)
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `extension/dist/` directory

## Usage

1. Navigate to a Quick Flows editor page
2. Click the extension icon in your toolbar
3. Click **Extract Flow** — the popup shows a preview of the extracted text
4. Click **Copy to Clipboard**
5. Click **Open in Exporter** to launch the local app, then paste the copied flow

The extension opens `http://localhost:5173` by default because the hosted app is an example-only demo. Start the local app with `npm start` before using **Open in Exporter**.

To build the extension for a different exporter URL:

```bash
EXPORTER_BASE_URL=https://your-exporter.example npm run build:extension
```
