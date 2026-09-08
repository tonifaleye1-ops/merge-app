import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Memory } from "@/types/schema";
import { extractAndSaveMemories } from "./extractAndSaveMemories";
import type { CompletionFn } from "./completion";

function createFakeSupabase(savedRows: Memory[]) {
  const select = vi.fn().mockResolvedValue({ data: savedRows, error: null });
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });

  return { client: { from } as unknown as SupabaseClient<Database>, insert };
}

describe("extractAndSaveMemories", () => {
  it("extracts facts via the completion function and persists them via saveMemories", async () => {
    const complete: CompletionFn = async () =>
      `[{"fact":"Is a backend engineer at a fintech startup","category":"work"}]`;

    const savedRows: Memory[] = [
      {
        id: "mem-1",
        user_id: "user-1",
        fact: "Is a backend engineer at a fintech startup",
        category: "work",
        created_at: "2026-01-01T00:00:00.000Z",
        source_message_id: "msg-1",
      },
    ];
    const { client, insert } = createFakeSupabase(savedRows);

    const result = await extractAndSaveMemories({
      supabase: client,
      complete,
      userId: "user-1",
      sourceMessageId: "msg-1",
      userMessage: "I work as a backend engineer at a fintech startup.",
      aiResponse: "Got it, that's helpful context.",
    });

    expect(insert).toHaveBeenCalledWith([
      {
        user_id: "user-1",
        fact: "Is a backend engineer at a fintech startup",
        category: "work",
        source_message_id: "msg-1",
      },
    ]);
    expect(result).toEqual(savedRows);
  });

  it("saves nothing when no durable facts are found", async () => {
    const complete: CompletionFn = async () => "[]";
    const { client, insert } = createFakeSupabase([]);

    const result = await extractAndSaveMemories({
      supabase: client,
      complete,
      userId: "user-1",
      userMessage: "Can you help me debug this error right now?",
      aiResponse: "Sure, paste the stack trace.",
    });

    expect(result).toEqual([]);
    expect(insert).not.toHaveBeenCalled();
  });
});
