/**
 * AI parsing abstraction.
 *
 * Calls a local proxy at /api/parse so the API key never touches the browser.
 * See README.md for setup instructions.
 */

const REQUEST_TIMEOUT_MS = 60_000; // 60 seconds

interface ParseRequest {
  system: string;
  userMessage: string;
  maxTokens?: number;
}

export async function parseWithAI({
  system,
  userMessage,
  maxTokens = 4096,
}: ParseRequest): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, userMessage, maxTokens }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`AI proxy returned ${res.status}: ${body}`);
    }

    const data: unknown = await res.json();
    if (
      typeof data === "object" &&
      data !== null &&
      "text" in data &&
      typeof (data as { text: string }).text === "string"
    ) {
      return (data as { text: string }).text;
    }
    throw new Error("Unexpected response shape from AI proxy");
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("AI request timed out after 60 seconds");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
