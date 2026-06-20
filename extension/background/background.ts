/**
 * Background service worker for the Quick Flow Exporter extension.
 * Handles messages from popup and coordinates tab creation.
 */

import { EXPORTER_BASE_URL } from './config';

chrome.runtime.onMessage.addListener((message: { type: string; text?: string }) => {
  if (message.type === 'OPEN_EXPORTER') {
    chrome.tabs.create({
      url: EXPORTER_BASE_URL,
    });
  }
});

export {};
