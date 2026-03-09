import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildError,
  buildContextString,
  buildUserContent,
  buildXaiPayload,
  buildXaiHeaders,
  buildTopicMessages,
  parseTopicKeywords,
  SYSTEM_PROMPT,
} from "./chatHelpers.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildError", () => {
  it("creates an Error with the given message and statusCode", () => {
    const err = buildError("Not found", 404);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Not found");
    expect(err.statusCode).toBe(404);
  });
});

describe("buildContextString", () => {
  it("returns empty string for null input", () => {
    expect(buildContextString(null)).toBe("");
  });

  it("returns empty string for empty array", () => {
    expect(buildContextString([])).toBe("");
  });

  it("returns empty string when documents have no content", () => {
    expect(buildContextString([{ content: "" }, { content: null }])).toBe("");
  });

  it("builds context from documents", () => {
    const docs = [
      { content: "Battery passports are required." },
      { content: "EU regulation 2023/1542 applies." },
    ];
    const result = buildContextString(docs);
    expect(result).toContain("Relevant information:");
    expect(result).toContain("Battery passports are required.");
    expect(result).toContain("EU regulation 2023/1542 applies.");
  });

  it("stops adding documents when word limit is exceeded", () => {
    const longContent = Array(999).fill("word").join(" ");
    const docs = [
      { content: longContent },
      { content: "This should not appear." },
    ];
    const result = buildContextString(docs);
    expect(result).toContain("word");
    expect(result).not.toContain("This should not appear.");
  });

  it("stops accumulation when a document exceeds the word budget", () => {
    const oversized = Array(1100).fill("big").join(" ");
    const docs = [
      { content: oversized },
      { content: "Small doc fits." },
      { content: "Another small doc." },
    ];
    const result = buildContextString(docs);
    expect(result).toBe("");
  });

  it("skips documents with whitespace-only content", () => {
    const docs = [{ content: "   " }, { content: "Valid content here." }];
    const result = buildContextString(docs);
    expect(result).toContain("Valid content here.");
  });
});

describe("buildUserContent", () => {
  it("prepends context when provided", () => {
    const result = buildUserContent("Some context", "What is Ichnos?");
    expect(result).toBe("Some context\n\nQuestion: What is Ichnos?");
  });

  it("returns only question when context is empty", () => {
    const result = buildUserContent("", "What is Ichnos?");
    expect(result).toBe("Question: What is Ichnos?");
  });
});

describe("buildXaiPayload", () => {
  it("returns structured payload with model and temperature", () => {
    const messages = [{ role: "user", content: "Hello" }];
    const result = buildXaiPayload(messages, "grok-3-mini", 0.7);
    expect(result).toEqual({
      model: "grok-3-mini",
      messages: [{ role: "user", content: "Hello" }],
      temperature: 0.7,
    });
  });
});

describe("buildXaiHeaders", () => {
  it("returns authorization and content-type headers", () => {
    vi.stubEnv("XAI_API_KEY", "test-key-123");
    const result = buildXaiHeaders();
    expect(result).toEqual({
      Authorization: "Bearer test-key-123",
      "Content-Type": "application/json",
    });
  });
});

describe("buildTopicMessages", () => {
  it("builds a single-message array for topic extraction", () => {
    const result = buildTopicMessages("What is a battery passport?");
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("user");
    expect(result[0].content).toContain("battery passport");
    expect(result[0].content).toContain("comma-separated keywords");
  });
});

describe("parseTopicKeywords", () => {
  it("parses comma-separated topics", () => {
    const result = parseTopicKeywords("battery, passport, compliance");
    expect(result).toEqual(["battery", "passport", "compliance"]);
  });

  it("trims and lowercases topics", () => {
    const result = parseTopicKeywords("  Battery ,  PASSPORT  ");
    expect(result).toEqual(["battery", "passport"]);
  });

  it("filters out empty strings", () => {
    const result = parseTopicKeywords("battery,,passport,");
    expect(result).toEqual(["battery", "passport"]);
  });

  it("filters out topics longer than 50 characters", () => {
    const longTopic = "a".repeat(51);
    const result = parseTopicKeywords(`battery, ${longTopic}, passport`);
    expect(result).toEqual(["battery", "passport"]);
  });

  it("limits to 3 topics", () => {
    const result = parseTopicKeywords("a, b, c, d, e");
    expect(result).toHaveLength(3);
  });
});

describe("SYSTEM_PROMPT", () => {
  it("is a non-empty string mentioning Ichnos Protocol", () => {
    expect(typeof SYSTEM_PROMPT).toBe("string");
    expect(SYSTEM_PROMPT).toContain("Ichnos Protocol");
  });
});
