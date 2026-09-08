import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAnthropicCompletionFn,
  createCompletionFn,
  createGoogleCompletionFn,
  createOpenAICompletionFn,
} from "./completion";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createAnthropicCompletionFn", () => {
  it("posts to the Anthropic messages endpoint and extracts the text blocks", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ content: [{ type: "text", text: "hi there" }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const complete = createAnthropicCompletionFn("test-key");
    const result = await complete({ system: "be nice", prompt: "hello" });

    expect(result).toBe("hi there");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(init.headers["x-api-key"]).toBe("test-key");
    const body = JSON.parse(init.body);
    expect(body.system).toBe("be nice");
    expect(body.messages).toEqual([{ role: "user", content: "hello" }]);
  });

  it("throws with the response body on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "bad key" }, false, 401)),
    );

    const complete = createAnthropicCompletionFn("bad-key");

    await expect(complete({ system: "s", prompt: "p" })).rejects.toThrow(/401/);
  });
});

describe("createOpenAICompletionFn", () => {
  it("posts to the chat completions endpoint and extracts the message content", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "hi from gpt" } }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const complete = createOpenAICompletionFn("test-key");
    const result = await complete({ system: "be nice", prompt: "hello" });

    expect(result).toBe("hi from gpt");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init.headers.authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body);
    expect(body.messages).toEqual([
      { role: "system", content: "be nice" },
      { role: "user", content: "hello" },
    ]);
  });
});

describe("createGoogleCompletionFn", () => {
  it("posts to the generateContent endpoint and joins the response parts", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: "hi from gemini" }] } }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const complete = createGoogleCompletionFn("test-key");
    const result = await complete({ system: "be nice", prompt: "hello" });

    expect(result).toBe("hi from gemini");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("generativelanguage.googleapis.com");
    expect(init.headers["x-goog-api-key"]).toBe("test-key");
    expect(url).not.toContain("test-key");
  });
});

describe("createCompletionFn", () => {
  it("dispatches to the right provider adapter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ choices: [{ message: { content: "ok" } }] }),
      ),
    );

    const complete = createCompletionFn("openai", "test-key");
    await complete({ system: "s", prompt: "p" });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.anything(),
    );
  });
});
