const BASE_SYSTEM_PROMPT = "You are a helpful, direct AI assistant.";

/**
 * Injects a memory context block (from formatMemoriesPrompt) under the
 * assistant's base persona. Pure function so the composition itself is
 * trivially testable, independent of where the memory block came from.
 */
export function buildSystemPrompt(memoryContext: string): string {
  return memoryContext
    ? `${BASE_SYSTEM_PROMPT}\n\n${memoryContext}`
    : BASE_SYSTEM_PROMPT;
}
