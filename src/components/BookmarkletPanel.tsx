import { useState, useRef, useEffect } from "react";

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
      alert('Quick Flow content copied! (' + text.length + ' chars)\\nPaste it into the QS Exporter.');
    }).catch(function() {
      /* Fallback: prompt with text for manual copy */
      var w = window.open('', '_blank');
      if (w) {
        w.document.write('<html><head><title>QS Export</title></head><body><pre>' + text.replace(/</g,'&lt;') + '</pre></body></html>');
        w.document.close();
      } else {
        prompt('Popup blocked. Copy the text manually:', text.substring(0, 2000));
      }
    });
  } catch(e) {
    alert('QS Exporter bookmarklet error: ' + e.message);
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
    <div className="bg-midnight-800 border border-midnight-700 rounded-xl shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">🔖</span>
        <span className="font-semibold text-sm text-cyan-400 font-mono">One-Click Bookmarklet</span>
      </div>
      <p className="text-xs text-slate-400">
        Drag the button below to your bookmarks bar. When you're on a Quick Flows editor page,
        click it to instantly copy the flow content to your clipboard.
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        {/* The actual draggable bookmarklet link — href set via ref to bypass React 19 sanitization */}
        <a
          ref={linkRef}
          href="#"
          onClick={(e) => e.preventDefault()}
          className="inline-flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-cyan-500/20 hover:bg-cyan-500 cursor-grab active:cursor-grabbing select-none"
          title="Drag this to your bookmarks bar"
        >
          ⚡ QS Export
        </a>
        <span className="text-xs text-slate-500">← Drag to bookmarks bar</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-xs text-cyan-500 hover:text-cyan-400 underline"
        >
          {showCode ? "Hide source" : "View source"}
        </button>
        <button
          onClick={copyCode}
          className="text-xs text-cyan-500 hover:text-cyan-400 underline"
        >
          {copied ? "✓ Copied!" : "Copy bookmarklet URL"}
        </button>
      </div>

      {showCode && (
        <pre className="text-xs font-mono bg-[#0d1117] text-slate-400 rounded-lg p-3 border border-midnight-700 overflow-x-auto max-h-48 whitespace-pre-wrap">
          {BOOKMARKLET_SOURCE}
        </pre>
      )}
    </div>
  );
}
