import { describe, it, expect } from "vitest";
import { buildError, buildContextString } from "./chatHelpers.js";

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

  it("skips documents with whitespace-only content", () => {
    const docs = [{ content: "   " }, { content: "Valid content here." }];
    const result = buildContextString(docs);
    expect(result).toContain("Valid content here.");
  });
});
