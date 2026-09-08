import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Memory, Message } from "@/types/schema";
import { sendMessage } from "./sendMessage";
import type { CompletionFn } from "./completion";

const memory = (overrides: Partial<Memory> = {}): Memory => ({
  id: "mem-1",
  user_id: "user-1",
  fact: "Works as a backend engineer",
  category: "work",
  created_at: "2026-01-01T00:00:00.000Z",
  source_message_id: null,
  ...overrides,
});

function createFakeSupabase(options: {
  memories: Memory[];
  apiKey: string | null;
  savedMessages: Message[];
}) {
  const { memories, apiKey, savedMessages } = options;
  let messageInsertIndex = 0;

  const from = vi.fn((table: string) => {
    if (table === "memories") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: memories, error: null }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    }

    if (table === "api_keys") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: apiKey ? { encrypted_key: apiKey } : null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };
    }

    if (table === "messages") {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(async () => ({
              data: savedMessages[messageInsertIndex++],
              error: null,
            })),
          }),
        }),
      };
    }

    throw new Error(`Unexpected table in test: ${table}`);
  });

  return { client: { from } as unknown as SupabaseClient<Database> };
}

const userMessage: Message = {
  id: "msg-user-1",
  conversation_id: "conv-1",
  role: "user",
  content: "I just started a new project",
  model_used: null,
  created_at: "2026-01-01T00:00:01.000Z",
};

const assistantMessage: Message = {
  id: "msg-assistant-1",
  conversation_id: "conv-1",
  role: "assistant",
  content: "That's exciting, tell me more!",
  model_used: "anthropic",
  created_at: "2026-01-01T00:00:02.000Z",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendMessage", () => {
  it("retrieves memories, injects them into the system prompt, calls the chosen provider, saves the exchange, and extracts new memories", async () => {
    const { client } = createFakeSupabase({
      memories: [memory()],
      apiKey: "sk-test-123",
      savedMessages: [userMessage, assistantMessage],
    });

    let extractionCalled = false;
    let capturedSystem = "";
    let capturedPrompt = "";
    const fakeComplete: CompletionFn = async ({ system, prompt }) => {
      if (!capturedSystem) {
        capturedSystem = system;
        capturedPrompt = prompt;
        return assistantMessage.content;
      }
      extractionCalled = true;
      return "[]";
    };

    const createCompletionFn = vi.fn().mockReturnValue(fakeComplete);

    const result = await sendMessage(
      "user-1",
      "I just started a new project",
      "anthropic",
      { supabase: client, conversationId: "conv-1", createCompletionFn },
    );

    expect(createCompletionFn).toHaveBeenCalledWith("anthropic", "sk-test-123");
    expect(capturedSystem).toContain("Works as a backend engineer");
    expect(capturedPrompt).toBe("I just started a new project");
    expect(extractionCalled).toBe(true);
    expect(result).toEqual({
      response: assistantMessage.content,
      userMessage,
      assistantMessage,
    });
  });

  it("throws when the user has no key on file for the chosen provider", async () => {
    const { client } = createFakeSupabase({
      memories: [],
      apiKey: null,
      savedMessages: [userMessage, assistantMessage],
    });

    await expect(
      sendMessage("user-1", "hello", "google", {
        supabase: client,
        conversationId: "conv-1",
        createCompletionFn: vi.fn(),
      }),
    ).rejects.toThrow(/No google API key/);
  });

  it("does not fail the request when memory extraction errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { client } = createFakeSupabase({
      memories: [],
      apiKey: "sk-test-123",
      savedMessages: [userMessage, assistantMessage],
    });

    let callCount = 0;
    const fakeComplete: CompletionFn = async () => {
      callCount += 1;
      if (callCount === 1) return assistantMessage.content;
      throw new Error("extraction model unavailable");
    };

    const result = await sendMessage("user-1", "hello", "anthropic", {
      supabase: client,
      conversationId: "conv-1",
      createCompletionFn: () => fakeComplete,
    });

    expect(result.response).toBe(assistantMessage.content);
    expect(console.error).toHaveBeenCalled();
  });
});
