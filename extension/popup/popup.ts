/**
 * Popup script for the Quick Flow Exporter browser extension.
 * Handles user interactions: extract, copy, and open in exporter.
 */

let extractedText = '';

const statusEl = document.getElementById('status')!;
const extractBtn = document.getElementById('extract-btn') as HTMLButtonElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
const openBtn = document.getElementById('open-btn') as HTMLButtonElement;
const previewContainer = document.getElementById('preview-container')!;
const previewEl = document.getElementById('preview')!;

function setStatus(message: string, type: '' | 'success' | 'error' = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function enableActions() {
  copyBtn.disabled = false;
  openBtn.disabled = false;
}

// Extract flow content from the active tab
extractBtn.addEventListener('click', async () => {
  extractBtn.disabled = true;
  setStatus('Extracting...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setStatus('No active tab found.', 'error');
      extractBtn.disabled = false;
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Inline the extraction logic (content scripts can't import modules)
        const editor = document.querySelector(
          '[class*="flow-editor"], [class*="FlowEditor"], [data-testid*="flow"], main, [role="main"]'
        );
        let text = (editor || document.body).innerText;

        const extras: string[] = [];
        document
          .querySelectorAll('textarea, [contenteditable="true"], pre, code')
          .forEach((el) => {
            if (el.textContent && el.textContent.length > 20) {
              extras.push(el.textContent);
            }
          });

        if (extras.length) {
          text += '\n---EXTRA---\n' + extras.join('\n---\n');
        }

        return text;
      },
    });

    const text = results?.[0]?.result as string | undefined;
    if (text && text.length > 0) {
      extractedText = text;
      setStatus(`Extracted ${text.length.toLocaleString()} characters.`, 'success');
      enableActions();

      // Show preview
      previewContainer.classList.remove('hidden');
      previewEl.textContent = text.length > 500 ? text.slice(0, 500) + '\n...' : text;
    } else {
      setStatus('No content found on this page.', 'error');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setStatus(`Error: ${message}`, 'error');
  }

  extractBtn.disabled = false;
});

// Copy to clipboard
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(extractedText);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy to Clipboard';
    }, 2000);
  } catch {
    setStatus('Failed to copy. Try selecting the preview text manually.', 'error');
  }
});

// Open in exporter app
openBtn.addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({
      type: 'OPEN_EXPORTER',
      text: extractedText,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setStatus(`Failed to open exporter: ${message}`, 'error');
  }
});
