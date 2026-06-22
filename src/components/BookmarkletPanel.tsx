import { useState, useRef, useEffect } from 'react';
import { Bookmark, Code2, Copy, Zap } from 'lucide-react';

/**
 * Bookmarklet that scrapes the Quick Flows editor page DOM and
 * copies the structured text to clipboard, or opens the exporter
 * with the data encoded in the URL hash.
 */
const BOOKMARKLET_SOURCE = `
(function(){
  try {
    /* Grab all visible text from the flow editor */
    var editor = document.querySelector('[class*="flow-editor"], [class*="FlowEditor"], [data-testid*="flow"], main, [role="main"]');
    var text = (editor || document.body).innerText;

    /* Try to also grab hidden textareas / code mirrors */
    var extras = [];
    document.querySelectorAll('textarea, [contenteditable="true"], pre, code').forEach(function(el) {
      if (el.textContent && el.textContent.length > 20) extras.push(el.textContent);
    });
    if (extras.length) text += '\\n---EXTRA---\\n' + extras.join('\\n---\\n');

    /* Copy to clipboard */
    navigator.clipboard.writeText(text).then(function() {
      alert('Quick Flow content copied! (' + text.length + ' chars)\\nPaste it into the Quick Flow Exporter.');
    }).catch(function() {
      /* Fallback: prompt with text for manual copy */
      var w = window.open('', '_blank');
      if (w) {
        w.document.title = 'Quick Flow Export';
        var pre = w.document.createElement('pre');
        pre.textContent = text;
        w.document.body.appendChild(pre);
      } else {
        prompt('Popup blocked. Copy the text manually:', text.substring(0, 2000));
      }
    });
  } catch(e) {
    alert('Quick Flow Exporter bookmarklet error: ' + e.message);
  }
})();
`.trim();

const BOOKMARKLET_HREF = `javascript:${encodeURIComponent(BOOKMARKLET_SOURCE)}`;

export default function BookmarkletPanel() {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  // React 19 blocks javascript: URLs. Set href directly on the DOM to bypass.
  useEffect(() => {
    if (linkRef.current) linkRef.current.href = BOOKMARKLET_HREF;
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(BOOKMARKLET_HREF);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="bg-white/70 dark:bg-midnight-800/70 border border-slate-200 dark:border-midnight-700 rounded-lg p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2 font-semibold text-sm text-blue-600 dark:text-blue-400">
          <Bookmark aria-hidden="true" className="h-4 w-4" />
          Bookmarklet
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCode(!showCode)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Code2 aria-hidden="true" className="h-3.5 w-3.5" />
            {showCode ? 'Hide source' : 'View source'}
          </button>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Drag once to your bookmarks bar, then run it from a Quick Flows editor page.
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        {/* The actual draggable bookmarklet link — href set via ref to bypass React 19 sanitization */}
        <a
          ref={linkRef}
          href="#"
          onClick={(e) => e.preventDefault()}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm shadow-blue-500/20 hover:bg-blue-500 cursor-grab active:cursor-grabbing select-none"
          title="Drag this to your bookmarks bar"
        >
          <Zap aria-hidden="true" className="h-4 w-4" />
          Quick Flow Export
        </a>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          &larr; Drag to bookmarks bar
        </span>
      </div>

      {showCode && (
        <pre className="text-xs font-mono bg-slate-50 dark:bg-[#0d1117] text-slate-500 dark:text-slate-400 rounded-lg p-3 border border-slate-200 dark:border-midnight-700 overflow-x-auto max-h-48 whitespace-pre-wrap">
          {BOOKMARKLET_SOURCE}
        </pre>
      )}
    </div>
  );
}
