/**
 * Background service worker for the Quick Flow Exporter extension.
 * Handles messages from popup and coordinates tab creation.
 */

const EXPORTER_BASE_URL = 'https://quick-flow-exporter.pages.dev';

chrome.runtime.onMessage.addListener((message: { type: string; text?: string }) => {
  if (message.type === 'OPEN_EXPORTER' && message.text) {
    const encoded = encodeURIComponent(message.text);
    chrome.tabs.create({
      url: `${EXPORTER_BASE_URL}/#flow=${encoded}`,
    });
  }
});

export {};
