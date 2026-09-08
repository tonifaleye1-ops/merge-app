import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Memory } from "@/types/schema";
import type { ExtractedFact } from "./extractFacts";

export type SaveMemoriesParams = {
  userId: string;
  sourceMessageId?: string | null;
  facts: ExtractedFact[];
};

/**
 * Inserts extracted facts into the memories table as a single batch write.
 * Takes the Supabase client as a parameter so callers can inject a fake in
 * tests instead of hitting a real database.
 */
export async function saveMemories(
  supabase: SupabaseClient<Database>,
  { userId, sourceMessageId = null, facts }: SaveMemoriesParams,
): Promise<Memory[]> {
  if (facts.length === 0) return [];

  const rows = facts.map((fact) => ({
    user_id: userId,
    fact: fact.fact,
    category: fact.category,
    source_message_id: sourceMessageId,
  }));

  const { data, error } = await supabase
    .from("memories")
    .insert(rows)
    .select();

  if (error) {
    throw new Error(`Failed to save memories: ${error.message}`);
  }

  return data ?? [];
}
