import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/schema";
import { DEFAULT_MEMORY_LIMIT, getRelevantMemories } from "./getRelevantMemories";
import { formatMemoriesPrompt } from "./formatMemoriesPrompt";

export type BuildMemoryContextParams = {
  supabase: SupabaseClient<Database>;
  userId: string;
  /**
   * The message the model is about to respond to. Unused by this simple,
   * recency-based version — kept on the interface so callers and tests
   * don't need to change when retrieval becomes relevance-based (e.g.
   * embeddings similarity against this message).
   */
  incomingMessage: string;
  limit?: number;
};

/**
 * Retrieves a user's memories and formats them as a system-prompt block
 * ready to prepend to any model call. Composes getRelevantMemories +
 * formatMemoriesPrompt, so it's testable with a fake Supabase client.
 */
export async function buildMemoryContext(
  params: BuildMemoryContextParams,
): Promise<string> {
  const { supabase, userId, limit = DEFAULT_MEMORY_LIMIT } = params;

  const memories = await getRelevantMemories(supabase, userId, limit);
  return formatMemoriesPrompt(memories);
}
