import { useState, useMemo } from "react";
import type { Flow } from "../types";
import { generateMarkdown } from "../lib/markdown";
import { generateMermaid } from "../lib/mermaid";

type ExportFormat = "markdown" | "mermaid" | "json";

interface ExportPhaseProps {
  flow: Flow;
  onDownload: () => void;
  onBack: () => void;
}

export default function ExportPhase({
  flow,
  onDownload,
  onBack,
}: ExportPhaseProps) {
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [formatCopied, setFormatCopied] = useState(false);

  const content = useMemo(() => {
    switch (format) {
      case "markdown": return generateMarkdown(flow);
      case "mermaid": return generateMermaid(flow);
      case "json": return JSON.stringify(flow, null, 2);
    }
  }, [flow, format]);

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setFormatCopied(true);
      setTimeout(() => setFormatCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (HTTP context or permissions denied)
    }
  };

  const downloadContent = () => {
    const ext = format === "markdown" ? ".md" : format === "mermaid" ? ".mmd" : ".json";
    const mime = format === "json" ? "application/json" : "text/plain";
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (flow.title || "flow").replace(/[^a-zA-Z0-9-_ ]/g, "") + ext;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onDownload(); // record in history regardless of format
  };

  const formats: { key: ExportFormat; label: string; icon: string; desc: string }[] = [
    { key: "markdown", label: "Markdown", icon: "📄", desc: "Human-readable documentation" },
    { key: "mermaid", label: "Mermaid", icon: "🧜", desc: "Flowchart diagram (GitHub/Quip)" },
    { key: "json", label: "JSON", icon: "{ }", desc: "Canonical re-importable format" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        {/* Format selector */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {formats.map((f) => (
            <button
              key={f.key}
              onClick={() => setFormat(f.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                format === f.key
                  ? "bg-white shadow font-semibold text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title={f.desc}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={copyContent}
          className={`px-5 py-2 rounded-lg text-sm font-semibold shadow ${
            formatCopied
              ? "bg-green-600 text-white"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
          aria-live="polite"
        >
          {formatCopied ? "✓ Copied!" : "📋 Copy"}
        </button>
        <button
          onClick={downloadContent}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow"
        >
          ⬇ Download
        </button>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </button>
      </div>

      {/* Mermaid preview hint */}
      {format === "mermaid" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          💡 Paste this into any Mermaid-compatible renderer (GitHub markdown, Quip, mermaid.live) to see the flowchart.
        </div>
      )}

      <pre className="bg-white rounded-xl shadow-sm p-5 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[70vh] border select-all cursor-text">
        {content}
      </pre>
    </div>
  );
}
