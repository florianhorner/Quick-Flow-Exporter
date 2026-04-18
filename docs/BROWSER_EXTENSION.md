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
4. **Copy to Clipboard** to paste into the web app, or **Open in Exporter** to launch the app with the data pre-loaded
