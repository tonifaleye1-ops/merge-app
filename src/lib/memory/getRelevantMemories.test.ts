import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Memory } from "@/types/schema";
import { DEFAULT_MEMORY_LIMIT, getRelevantMemories } from "./getRelevantMemories";

function createFakeSupabase(result: {
  data: Memory[] | null;
  error: { message: string } | null;
}) {
  const limit = vi.fn().mockResolvedValue(result);
  const order = vi.fn().mockReturnValue({ limit });
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  return {
    client: { from } as unknown as SupabaseClient<Database>,
    from,
    select,
    eq,
    order,
    limit,
  };
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

describe("getRelevantMemories", () => {
  it("queries memories for the given user, most recent first, limited to 15 by default", async () => {
    const rows = [memory()];
    const { client, from, select, eq, order, limit } = createFakeSupabase({
      data: rows,
      error: null,
    });

    const result = await getRelevantMemories(client, "user-1");

    expect(from).toHaveBeenCalledWith("memories");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(DEFAULT_MEMORY_LIMIT);
    expect(result).toEqual(rows);
  });

  it("respects a custom limit", async () => {
    const { client, limit } = createFakeSupabase({ data: [], error: null });

    await getRelevantMemories(client, "user-1", 5);

    expect(limit).toHaveBeenCalledWith(5);
  });

  it("returns an empty array when there is no data", async () => {
    const { client } = createFakeSupabase({ data: null, error: null });

    const result = await getRelevantMemories(client, "user-1");

    expect(result).toEqual([]);
  });

  it("throws a descriptive error when the query fails", async () => {
    const { client } = createFakeSupabase({
      data: null,
      error: { message: "connection reset" },
    });

    await expect(getRelevantMemories(client, "user-1")).rejects.toThrow(
      /connection reset/,
    );
  });
});
