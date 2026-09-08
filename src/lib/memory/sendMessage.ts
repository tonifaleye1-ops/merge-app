import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiKeyProvider, Database, Message } from "@/types/schema";
import { buildMemoryContext } from "./buildMemoryContext";
import { buildSystemPrompt } from "./buildSystemPrompt";
import {
  createCompletionFn as defaultCreateCompletionFn,
  type CompletionFn,
} from "./completion";
import { extractAndSaveMemories } from "./extractAndSaveMemories";
import { getApiKey } from "./getApiKey";
import { saveMessage } from "./saveMessage";

export type ModelChoice = ApiKeyProvider;

export type SendMessageDeps = {
  supabase: SupabaseClient<Database>;
  conversationId: string;
  /** Defaults to the real provider adapters (completion.ts); override in tests. */
  createCompletionFn?: (provider: ApiKeyProvider, apiKey: string) => CompletionFn;
};

export type SendMessageResult = {
  response: string;
  userMessage: Message;
  assistantMessage: Message;
};

/**
 * The unified send-a-chat-message pipeline:
 *  1. Retrieve the user's relevant memories.
 *  2. Build a system prompt with those memories injected.
 *  3. Call the chosen provider's API with the user's stored key.
 *  4. Return the response.
 *  5. Save the exchange to the messages table.
 *  6. Trigger memory extraction on the exchange.
 *
 * `deps` carries the Supabase client, the target conversation, and (for
 * tests) a fake completion factory — kept out of the positional args so
 * this stays a plain, injectable, network/DB-free-in-tests function like
 * the rest of src/lib/memory.
 */
export async function sendMessage(
  userId: string,
  message: string,
  modelChoice: ModelChoice,
  {
    supabase,
    conversationId,
    createCompletionFn = defaultCreateCompletionFn,
  }: SendMessageDeps,
): Promise<SendMessageResult> {
  const memoryContext = await buildMemoryContext({
    supabase,
    userId,
    incomingMessage: message,
  });
  const system = buildSystemPrompt(memoryContext);

  const apiKey = await getApiKey(supabase, userId, modelChoice);
  const complete = createCompletionFn(modelChoice, apiKey);

  const response = await complete({ system, prompt: message });

  const userMessage = await saveMessage(supabase, {
    conversationId,
    role: "user",
    content: message,
  });

  const assistantMessage = await saveMessage(supabase, {
    conversationId,
    role: "assistant",
    content: response,
    modelUsed: modelChoice,
  });

  try {
    await extractAndSaveMemories({
      supabase,
      complete,
      userId,
      userMessage: message,
      aiResponse: response,
      sourceMessageId: assistantMessage.id,
    });
  } catch (error) {
    // Memory extraction is best-effort: the chat turn already succeeded
    // and is saved, so a flaky extraction call shouldn't fail the request.
    console.error("Memory extraction failed:", error);
  }

  return { response, userMessage, assistantMessage };
}
