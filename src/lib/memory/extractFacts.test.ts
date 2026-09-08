import { describe, expect, it } from "vitest";
import { extractFacts, parseExtractedFacts } from "./extractFacts";
import type { CompletionFn } from "./completion";

describe("parseExtractedFacts", () => {
  it("parses a plain JSON array", () => {
    const raw = `[{"fact":"Works as a backend engineer","category":"work"}]`;

    expect(parseExtractedFacts(raw)).toEqual([
      { fact: "Works as a backend engineer", category: "work" },
    ]);
  });

  it("strips a markdown code fence around the JSON", () => {
    const raw = '```json\n[{"fact":"Prefers dark mode","category":"preference"}]\n```';

    expect(parseExtractedFacts(raw)).toEqual([
      { fact: "Prefers dark mode", category: "preference" },
    ]);
  });

  it("returns an empty array when the model finds nothing durable", () => {
    expect(parseExtractedFacts("[]")).toEqual([]);
  });

  it("normalizes an unrecognized category to 'other'", () => {
    const raw = `[{"fact":"Owns a cat named Pixel","category":"pet"}]`;

    expect(parseExtractedFacts(raw)).toEqual([
      { fact: "Owns a cat named Pixel", category: "other" },
    ]);
  });

  it("defaults a missing category to null", () => {
    const raw = `[{"fact":"Lives in Toronto"}]`;

    expect(parseExtractedFacts(raw)).toEqual([
      { fact: "Lives in Toronto", category: null },
    ]);
  });

  it("drops malformed entries but keeps valid ones", () => {
    const raw = `[{"fact":"Is a vegetarian","category":"personal"},{"category":"work"},{"fact":"   "}]`;

    expect(parseExtractedFacts(raw)).toEqual([
      { fact: "Is a vegetarian", category: "personal" },
    ]);
  });

  it("throws when the response is not valid JSON", () => {
    expect(() => parseExtractedFacts("not json")).toThrow(/valid JSON/);
  });

  it("throws when the response is valid JSON but not an array", () => {
    expect(() => parseExtractedFacts('{"fact":"x"}')).toThrow(/JSON array/);
  });
});

describe("extractFacts", () => {
  it("sends the user message and AI response to the completion function and returns parsed facts", async () => {
    let receivedPrompt = "";
    let receivedSystem = "";

    const fakeComplete: CompletionFn = async ({ system, prompt }) => {
      receivedSystem = system;
      receivedPrompt = prompt;
      return `[{"fact":"Is planning a trip to Japan in March","category":"project"}]`;
    };

    const facts = await extractFacts(
      "I'm heading to Japan in March, so excited!",
      "That sounds amazing! Let me know if you want restaurant recommendations.",
      fakeComplete,
    );

    expect(facts).toEqual([
      { fact: "Is planning a trip to Japan in March", category: "project" },
    ]);
    expect(receivedSystem).toMatch(/durable facts/i);
    expect(receivedPrompt).toContain("I'm heading to Japan in March");
    expect(receivedPrompt).toContain("restaurant recommendations");
  });

  it("propagates errors from the completion function", async () => {
    const failingComplete: CompletionFn = async () => {
      throw new Error("network down");
    };

    await expect(
      extractFacts("hello", "hi there", failingComplete),
    ).rejects.toThrow("network down");
  });
});
