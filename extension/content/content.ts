/**
 * Content script that extracts Quick Flows editor content from the page DOM.
 * Reuses the same scraping logic as the bookmarklet in BookmarkletPanel.tsx.
 */

function extractFlowContent(): string {
  // Look for the flow editor container using common selectors
  const editor = document.querySelector(
    '[class*="flow-editor"], [class*="FlowEditor"], [data-testid*="flow"], main, [role="main"]'
  );
  let text = (editor || document.body).innerText;

  // Also grab hidden textareas / code mirrors for completeness
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
}

// Execute extraction and send result back
const result = extractFlowContent();
// Return result to the caller (chrome.scripting.executeScript)
result;
