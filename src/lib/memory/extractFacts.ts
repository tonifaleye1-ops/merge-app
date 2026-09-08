import type { CompletionFn } from "./completion";

export type ExtractedFact = {
  fact: string;
  category: string | null;
};

const FACT_CATEGORIES = [
  "preference",
  "work",
  "project",
  "personal",
  "other",
] as const;

const SYSTEM_PROMPT = `You extract durable facts about a user from one exchange with an AI assistant.

Only extract a fact if it is:
- Explicitly stated by the user, in the user's own message.
- Durable: still likely to be true and worth remembering later (a stable preference, work or role info, an ongoing project, a biographical fact).

Never extract:
- Opinions, feelings, or one-off requests ("can you help me with X right now").
- Anything inferred, assumed, or guessed rather than directly stated.
- Facts about the assistant or its response.

Respond with ONLY a JSON array — no markdown, no prose, no code fences. Each element must look like:
{"fact": "<short, self-contained statement of the fact>", "category": "<one of: ${FACT_CATEGORIES.join(", ")}>"}

If there are no durable facts worth remembering, respond with exactly: []`;

function buildPrompt(userMessage: string, aiResponse: string): string {
  return `User message:\n${userMessage}\n\nAssistant response:\n${aiResponse}`;
}

function stripCodeFence(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (match ? match[1] : text).trim();
}

function normalizeCategory(category: unknown): string | null {
  if (typeof category !== "string") return null;
  const normalized = category.trim().toLowerCase();
  return (FACT_CATEGORIES as readonly string[]).includes(normalized)
    ? normalized
    : "other";
}

function isFactCandidate(value: unknown): value is { fact: string; category?: unknown } {
  if (typeof value !== "object" || value === null) return false;

  const fact = (value as Record<string, unknown>).fact;
  return typeof fact === "string" && fact.trim().length > 0;
}

export function parseExtractedFacts(raw: string): ExtractedFact[] {
  const jsonText = stripCodeFence(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Fact extraction did not return valid JSON: ${raw}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Fact extraction did not return a JSON array: ${raw}`);
  }

  return parsed.filter(isFactCandidate).map((candidate) => ({
    fact: candidate.fact.trim(),
    category: normalizeCategory(candidate.category),
  }));
}

/**
 * Sends a user message + AI response to an LLM and extracts any durable
 * facts about the user worth remembering. Pure aside from the injected
 * `complete` call, so it can be unit tested with a fake completion function.
 */
export async function extractFacts(
  userMessage: string,
  aiResponse: string,
  complete: CompletionFn,
): Promise<ExtractedFact[]> {
  const raw = await complete({
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(userMessage, aiResponse),
  });

  return parseExtractedFacts(raw);
}
