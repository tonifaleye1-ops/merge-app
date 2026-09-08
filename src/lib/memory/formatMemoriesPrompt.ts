import type { Memory } from "@/types/schema";

const HEADER = "What you know about this user from previous conversations:";

/**
 * Formats memories as a short system-prompt block to prepend to a model
 * call. Returns an empty string when there's nothing to add, so callers can
 * skip prepending without a separate length check.
 */
export function formatMemoriesPrompt(memories: Memory[]): string {
  if (memories.length === 0) return "";

  const lines = memories.map((memory) =>
    memory.category ? `- [${memory.category}] ${memory.fact}` : `- ${memory.fact}`,
  );

  return [HEADER, ...lines].join("\n");
}
