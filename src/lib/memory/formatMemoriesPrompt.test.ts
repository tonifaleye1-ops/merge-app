import { describe, expect, it } from "vitest";
import type { Memory } from "@/types/schema";
import { formatMemoriesPrompt } from "./formatMemoriesPrompt";

const memory = (overrides: Partial<Memory> = {}): Memory => ({
  id: "mem-1",
  user_id: "user-1",
  fact: "Prefers dark mode",
  category: "preference",
  created_at: "2026-01-01T00:00:00.000Z",
  source_message_id: null,
  ...overrides,
});

describe("formatMemoriesPrompt", () => {
  it("returns an empty string when there are no memories", () => {
    expect(formatMemoriesPrompt([])).toBe("");
  });

  it("formats a single memory with its category as a bulleted line under a header", () => {
    const result = formatMemoriesPrompt([memory()]);

    expect(result).toBe(
      "What you know about this user from previous conversations:\n- [preference] Prefers dark mode",
    );
  });

  it("omits the bracketed tag for a memory with no category", () => {
    const result = formatMemoriesPrompt([
      memory({ fact: "Lives in Toronto", category: null }),
    ]);

    expect(result).toBe(
      "What you know about this user from previous conversations:\n- Lives in Toronto",
    );
  });

  it("preserves the given order and includes one line per memory", () => {
    const memories = [
      memory({ id: "mem-1", fact: "Prefers dark mode", category: "preference" }),
      memory({ id: "mem-2", fact: "Works as a backend engineer", category: "work" }),
      memory({ id: "mem-3", fact: "Lives in Toronto", category: null }),
    ];

    const result = formatMemoriesPrompt(memories);

    expect(result.split("\n")).toEqual([
      "What you know about this user from previous conversations:",
      "- [preference] Prefers dark mode",
      "- [work] Works as a backend engineer",
      "- Lives in Toronto",
    ]);
  });
});
