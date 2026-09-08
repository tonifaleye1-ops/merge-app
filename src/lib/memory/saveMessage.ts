import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Message, MessageRole } from "@/types/schema";

export type SaveMessageParams = {
  conversationId: string;
  role: MessageRole;
  content: string;
  modelUsed?: string | null;
};

export async function saveMessage(
  supabase: SupabaseClient<Database>,
  { conversationId, role, content, modelUsed = null }: SaveMessageParams,
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      model_used: modelUsed,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save message: ${error.message}`);
  }

  return data;
}
