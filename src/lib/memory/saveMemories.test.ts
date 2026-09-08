import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Memory } from "@/types/schema";
import { saveMemories } from "./saveMemories";

function createFakeSupabase(result: {
  data: Memory[] | null;
  error: { message: string } | null;
}) {
  const select = vi.fn().mockResolvedValue(result);
  const insert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ insert });

  return {
    client: { from } as unknown as SupabaseClient<Database>,
    from,
    insert,
    select,
  };
}

describe("saveMemories", () => {
  it("inserts one row per fact, scoped to the user and source message", async () => {
    const savedRows: Memory[] = [
      {
        id: "mem-1",
        user_id: "user-1",
        fact: "Works as a backend engineer",
        category: "work",
        created_at: "2026-01-01T00:00:00.000Z",
        source_message_id: "msg-1",
      },
    ];
    const { client, from, insert } = createFakeSupabase({
      data: savedRows,
      error: null,
    });

    const result = await saveMemories(client, {
      userId: "user-1",
      sourceMessageId: "msg-1",
      facts: [{ fact: "Works as a backend engineer", category: "work" }],
    });

    expect(from).toHaveBeenCalledWith("memories");
    expect(insert).toHaveBeenCalledWith([
      {
        user_id: "user-1",
        fact: "Works as a backend engineer",
        category: "work",
        source_message_id: "msg-1",
      },
    ]);
    expect(result).toEqual(savedRows);
  });

  it("defaults sourceMessageId to null when omitted", async () => {
    const { client, insert } = createFakeSupabase({ data: [], error: null });

    await saveMemories(client, {
      userId: "user-1",
      facts: [{ fact: "Prefers dark mode", category: "preference" }],
    });

    expect(insert).toHaveBeenCalledWith([
      {
        user_id: "user-1",
        fact: "Prefers dark mode",
        category: "preference",
        source_message_id: null,
      },
    ]);
  });

  it("returns an empty array without touching the database when there are no facts", async () => {
    const { client, from } = createFakeSupabase({ data: [], error: null });

    const result = await saveMemories(client, {
      userId: "user-1",
      facts: [],
    });

    expect(result).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("throws a descriptive error when the insert fails", async () => {
    const { client } = createFakeSupabase({
      data: null,
      error: { message: "permission denied" },
    });

    await expect(
      saveMemories(client, {
        userId: "user-1",
        facts: [{ fact: "Lives in Toronto", category: "personal" }],
      }),
    ).rejects.toThrow(/permission denied/);
  });
});
