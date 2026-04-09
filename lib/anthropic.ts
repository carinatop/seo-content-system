import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const MODELS = {
  opus: process.env.ANTHROPIC_MODEL_OPUS ?? "claude-opus-4-5",
  haiku: process.env.ANTHROPIC_MODEL_HAIKU ?? "claude-haiku-4-5",
};

function extractText(res: Anthropic.Message): string {
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/** Extract a JSON object from a possibly-wrapped string. */
function parseJSONLoose<T>(text: string): T {
  // Strip code fences
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(json)?\s*/i, "").replace(/```\s*$/, "");
  }
  // Find first { and last }
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1) {
    throw new Error("No JSON object found in response: " + s.slice(0, 300));
  }
  const slice = s.slice(first, last + 1);
  try {
    return JSON.parse(slice) as T;
  } catch (e: any) {
    throw new Error("JSON parse failed: " + e.message + " | raw: " + slice.slice(0, 300));
  }
}

/** Run a Claude call expecting JSON back. */
export async function callJSON<T = unknown>(opts: {
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const res = await anthropic.messages.create({
    model: opts.model ?? MODELS.opus,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system + "\n\nReturn ONLY valid JSON. No prose, no markdown fences.",
    messages: [{ role: "user", content: opts.user }],
  });
  const text = extractText(res);
  return parseJSONLoose<T>(text);
}

/** Run a Claude call expecting markdown back. */
export async function callMarkdown(opts: {
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const res = await anthropic.messages.create({
    model: opts.model ?? MODELS.opus,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  return extractText(res);
}
