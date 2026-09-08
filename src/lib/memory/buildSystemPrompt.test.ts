import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "./buildSystemPrompt";

describe("buildSystemPrompt", () => {
  it("returns just the base persona when there's no memory context", () => {
    expect(buildSystemPrompt("")).toBe("You are a helpful, direct AI assistant.");
  });

  it("appends the memory context under the base persona", () => {
    const memoryContext =
      "What you know about this user from previous conversations:\n- [work] Works as a backend engineer";

    expect(buildSystemPrompt(memoryContext)).toBe(
      `You are a helpful, direct AI assistant.\n\n${memoryContext}`,
    );
  });
});
