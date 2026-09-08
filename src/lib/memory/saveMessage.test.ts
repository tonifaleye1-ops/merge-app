import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Message } from "@/types/schema";
import { saveMessage } from "./saveMessage";

function createFakeSupabase(result: {
  data: Message | null;
  error: { message: string } | null;
}) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });

  return { client: { from } as unknown as SupabaseClient<Database>, from, insert };
}

const savedMessage: Message = {
  id: "msg-1",
  conversation_id: "conv-1",
  role: "assistant",
  content: "hi there",
  model_used: "anthropic",
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("saveMessage", () => {
  it("inserts a message row for the given conversation", async () => {
    const { client, from, insert } = createFakeSupabase({
      data: savedMessage,
      error: null,
    });

    const result = await saveMessage(client, {
      conversationId: "conv-1",
      role: "assistant",
      content: "hi there",
      modelUsed: "anthropic",
    });

    expect(from).toHaveBeenCalledWith("messages");
    expect(insert).toHaveBeenCalledWith({
      conversation_id: "conv-1",
      role: "assistant",
      content: "hi there",
      model_used: "anthropic",
    });
    expect(result).toEqual(savedMessage);
  });

  it("defaults modelUsed to null when omitted", async () => {
    const { client, insert } = createFakeSupabase({
      data: savedMessage,
      error: null,
    });

    await saveMessage(client, {
      conversationId: "conv-1",
      role: "user",
      content: "hello",
    });

    expect(insert).toHaveBeenCalledWith({
      conversation_id: "conv-1",
      role: "user",
      content: "hello",
      model_used: null,
    });
  });

  it("throws a descriptive error when the insert fails", async () => {
    const { client } = createFakeSupabase({
      data: null,
      error: { message: "conversation not found" },
    });

    await expect(
      saveMessage(client, {
        conversationId: "missing",
        role: "user",
        content: "hello",
      }),
    ).rejects.toThrow(/conversation not found/);
  });
});
