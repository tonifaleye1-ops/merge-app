import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiKeyProvider, Database } from "@/types/schema";
import { decryptApiKey } from "./apiKeyEncryption";

/**
 * Looks up a user's most recently added key for a provider and decrypts
 * it. Throws if the user hasn't connected that provider yet.
 */
export async function getApiKey(
  supabase: SupabaseClient<Database>,
  userId: string,
  provider: ApiKeyProvider,
): Promise<string> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("encrypted_key")
    .eq("user_id", userId)
    .eq("provider", provider)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to look up API key: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No ${provider} API key on file for this user`);
  }

  return decryptApiKey(data.encrypted_key);
}
