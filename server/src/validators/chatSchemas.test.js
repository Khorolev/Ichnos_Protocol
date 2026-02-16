import { describe, it, expect } from "vitest";
import { chatMessageSchema } from "./chatSchemas.js";

describe("chatMessageSchema", () => {
  it("accepts a valid message", () => {
    const result = chatMessageSchema.safeParse({ question: "What is Ichnos?" });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from the message", () => {
    const result = chatMessageSchema.safeParse({ question: "  Hello  " });
    expect(result.success).toBe(true);
    expect(result.data.question).toBe("Hello");
  });

  it("rejects empty string", () => {
    const result = chatMessageSchema.safeParse({ question: "" });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    const result = chatMessageSchema.safeParse({ question: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects message exceeding 2000 characters", () => {
    const result = chatMessageSchema.safeParse({ question: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("accepts message at exactly 2000 characters", () => {
    const result = chatMessageSchema.safeParse({ question: "a".repeat(2000) });
    expect(result.success).toBe(true);
  });

  it("rejects missing question field", () => {
    const result = chatMessageSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
