import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Memory } from "@/types/schema";
import type { CompletionFn } from "./completion";
import { extractFacts } from "./extractFacts";
import { saveMemories } from "./saveMemories";

export type ExtractAndSaveMemoriesParams = {
  supabase: SupabaseClient<Database>;
  complete: CompletionFn;
  userId: string;
  userMessage: string;
  aiResponse: string;
  /** The message this exchange's AI response was persisted as, if any. */
  sourceMessageId?: string | null;
};

/**
 * Extracts durable facts about the user from one exchange and saves them to
 * the memories table. Every side effect (the LLM call, the DB write) is
 * injected, so this function stays a thin, fully testable composition of
 * extractFacts + saveMemories.
 */
export async function extractAndSaveMemories({
  supabase,
  complete,
  userId,
  userMessage,
  aiResponse,
  sourceMessageId = null,
}: ExtractAndSaveMemoriesParams): Promise<Memory[]> {
  const facts = await extractFacts(userMessage, aiResponse, complete);
  return saveMemories(supabase, { userId, sourceMessageId, facts });
}
