import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Memory } from "@/types/schema";

export const DEFAULT_MEMORY_LIMIT = 15;

/**
 * Retrieves memories for a user to ground a model call.
 *
 * Simple version: just the most recent memories, most recent first. No
 * relevance ranking against the incoming message yet — that's the natural
 * next step (embeddings similarity search, keyword match, etc.) once this
 * is proven out.
 */
export async function getRelevantMemories(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = DEFAULT_MEMORY_LIMIT,
): Promise<Memory[]> {
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load memories: ${error.message}`);
  }

  return data ?? [];
}
