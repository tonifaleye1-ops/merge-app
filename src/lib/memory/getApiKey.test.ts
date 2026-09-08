import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/schema";
import { getApiKey } from "./getApiKey";

function createFakeSupabase(result: {
  data: { encrypted_key: string } | null;
  error: { message: string } | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const limit = vi.fn().mockReturnValue({ maybeSingle });
  const order = vi.fn().mockReturnValue({ limit });
  const eqProvider = vi.fn().mockReturnValue({ order });
  const eqUser = vi.fn().mockReturnValue({ eq: eqProvider });
  const select = vi.fn().mockReturnValue({ eq: eqUser });
  const from = vi.fn().mockReturnValue({ select });

  return {
    client: { from } as unknown as SupabaseClient<Database>,
    from,
    select,
    eqUser,
    eqProvider,
  };
}

describe("getApiKey", () => {
  it("looks up the user's most recent key for the given provider and decrypts it", async () => {
    const { client, from, select, eqUser, eqProvider } = createFakeSupabase({
      data: { encrypted_key: "sk-test-123" },
      error: null,
    });

    const key = await getApiKey(client, "user-1", "openai");

    expect(from).toHaveBeenCalledWith("api_keys");
    expect(select).toHaveBeenCalledWith("encrypted_key");
    expect(eqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(eqProvider).toHaveBeenCalledWith("provider", "openai");
    expect(key).toBe("sk-test-123");
  });

  it("throws when the user has no key on file for that provider", async () => {
    const { client } = createFakeSupabase({ data: null, error: null });

    await expect(getApiKey(client, "user-1", "google")).rejects.toThrow(
      /No google API key/,
    );
  });

  it("throws a descriptive error when the query fails", async () => {
    const { client } = createFakeSupabase({
      data: null,
      error: { message: "permission denied" },
    });

    await expect(getApiKey(client, "user-1", "anthropic")).rejects.toThrow(
      /permission denied/,
    );
  });
});
