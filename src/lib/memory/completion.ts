import type { ApiKeyProvider } from "@/types/schema";

/**
 * Minimal LLM completion abstraction. Keeping this narrow (system + prompt
 * in, text out) lets callers like extractFacts and sendMessage stay
 * provider-agnostic and easy to test with a fake implementation instead of
 * a mocked HTTP client.
 */
export type CompletionFn = (params: {
  system: string;
  prompt: string;
}) => Promise<string>;

export function createAnthropicCompletionFn(
  apiKey: string,
  model = "claude-haiku-4-5-20251001",
): CompletionFn {
  return async ({ system, prompt }) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Anthropic completion request failed (${response.status}): ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      content: { type: string; text?: string }[];
    };

    return data.content
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text)
      .join("");
  };
}

export function createOpenAICompletionFn(
  apiKey: string,
  model = "gpt-4o-mini",
): CompletionFn {
  return async ({ system, prompt }) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI completion request failed (${response.status}): ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    return data.choices[0]?.message.content ?? "";
  };
}

export function createGoogleCompletionFn(
  apiKey: string,
  model = "gemini-3.6-flash",
): CompletionFn {
  return async ({ system, prompt }) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Google completion request failed (${response.status}): ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      candidates: { content: { parts: { text: string }[] } }[];
    };

    return (
      data.candidates[0]?.content.parts.map((part) => part.text).join("") ?? ""
    );
  };
}

/**
 * Builds the right CompletionFn for a provider, so callers that only know
 * which provider a user picked (not which SDK/endpoint it maps to) have a
 * single entry point.
 */
export function createCompletionFn(
  provider: ApiKeyProvider,
  apiKey: string,
): CompletionFn {
  switch (provider) {
    case "openai":
      return createOpenAICompletionFn(apiKey);
    case "anthropic":
      return createAnthropicCompletionFn(apiKey);
    case "google":
      return createGoogleCompletionFn(apiKey);
  }
}
