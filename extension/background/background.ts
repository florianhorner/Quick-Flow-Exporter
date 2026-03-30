/**
 * Background service worker for the Quick Flow Exporter extension.
 * Handles messages from popup and coordinates with content scripts.
 */

chrome.runtime.onMessage.addListener(
  (
    message: { type: string; text?: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean }) => void
  ) => {
    if (message.type === 'OPEN_EXPORTER' && message.text) {
      // Open the exporter app with flow data encoded in the URL hash
      const encoded = encodeURIComponent(message.text);
      chrome.tabs.create({
        url: `https://quick-flow-exporter.pages.dev/#flow=${encoded}`,
      });
      sendResponse({ success: true });
    }
    return false;
  }
);

export {};
