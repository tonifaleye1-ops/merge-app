import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Memory } from "@/types/schema";
import { buildMemoryContext } from "./buildMemoryContext";

function createFakeSupabase(rows: Memory[]) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
  const order = vi.fn().mockReturnValue({ limit });
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  return { client: { from } as unknown as SupabaseClient<Database>, eq, limit };
}

const memory = (overrides: Partial<Memory> = {}): Memory => ({
  id: "mem-1",
  user_id: "user-1",
  fact: "Prefers dark mode",
  category: "preference",
  created_at: "2026-01-01T00:00:00.000Z",
  source_message_id: null,
  ...overrides,
});

describe("buildMemoryContext", () => {
  it("retrieves the user's memories and formats them as a prompt block", async () => {
    const { client, eq } = createFakeSupabase([memory()]);

    const result = await buildMemoryContext({
      supabase: client,
      userId: "user-1",
      incomingMessage: "What should I work on today?",
    });

    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(result).toBe(
      "What you know about this user from previous conversations:\n- [preference] Prefers dark mode",
    );
  });

  it("returns an empty string when the user has no memories", async () => {
    const { client } = createFakeSupabase([]);

    const result = await buildMemoryContext({
      supabase: client,
      userId: "user-1",
      incomingMessage: "Hello",
    });

    expect(result).toBe("");
  });

  it("passes a custom limit through to the memory lookup", async () => {
    const { client, limit } = createFakeSupabase([]);

    await buildMemoryContext({
      supabase: client,
      userId: "user-1",
      incomingMessage: "Hello",
      limit: 3,
    });

    expect(limit).toHaveBeenCalledWith(3);
  });
});
