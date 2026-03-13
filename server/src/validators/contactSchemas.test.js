import { describe, it, expect } from "vitest";
import {
  contactSubmitSchema,
  updateRequestSchema,
  addQuestionSchema,
} from "./contactSchemas.js";

describe("contactSubmitSchema", () => {
  const validPayload = {
    questions: [{ text: "Tell me about your services" }],
    consentTimestamp: "2026-02-16T12:00:00Z",
    consentVersion: "v1",
  };

  it("accepts a valid submission", () => {
    const result = contactSubmitSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts multiple questions", () => {
    const result = contactSubmitSchema.safeParse({
      ...validPayload,
      questions: [{ text: "Question 1" }, { text: "Question 2" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty questions array", () => {
    const result = contactSubmitSchema.safeParse({ ...validPayload, questions: [] });
    expect(result.success).toBe(false);
  });

  it("rejects question with empty text", () => {
    const result = contactSubmitSchema.safeParse({
      ...validPayload,
      questions: [{ text: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects question exceeding 2000 characters", () => {
    const result = contactSubmitSchema.safeParse({
      ...validPayload,
      questions: [{ text: "a".repeat(2001) }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing consentTimestamp", () => {
    const { consentTimestamp: _, ...rest } = validPayload;
    const result = contactSubmitSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid consentTimestamp format", () => {
    const result = contactSubmitSchema.safeParse({
      ...validPayload,
      consentTimestamp: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("accepts consentTimestamp with timezone offset", () => {
    const result = contactSubmitSchema.safeParse({
      ...validPayload,
      consentTimestamp: "2026-02-16T12:00:00+02:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing consentVersion", () => {
    const { consentVersion: _v, ...rest } = validPayload;
    const result = contactSubmitSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("updateRequestSchema", () => {
  it("accepts valid status update", () => {
    const result = updateRequestSchema.safeParse({ status: "in_progress" });
    expect(result.success).toBe(true);
  });

  it("accepts all valid status values", () => {
    for (const status of ["new", "contacted", "in_progress", "resolved"]) {
      const result = updateRequestSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status value", () => {
    const result = updateRequestSchema.safeParse({ status: "invalid" });
    expect(result.success).toBe(false);
  });

  it("accepts status with optional adminNotes", () => {
    const result = updateRequestSchema.safeParse({
      status: "resolved",
      adminNotes: "Called and resolved the issue",
    });
    expect(result.success).toBe(true);
  });

  it("rejects adminNotes exceeding 5000 characters", () => {
    const result = updateRequestSchema.safeParse({
      status: "new",
      adminNotes: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});

describe("addQuestionSchema", () => {
  it("accepts a valid question string", () => {
    const result = addQuestionSchema.safeParse({ question: "What is your pricing?" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty question string", () => {
    const result = addQuestionSchema.safeParse({ question: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only question string", () => {
    const result = addQuestionSchema.safeParse({ question: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a missing question field", () => {
    const result = addQuestionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a non-string question value", () => {
    const result = addQuestionSchema.safeParse({ question: 42 });
    expect(result.success).toBe(false);
  });

  it("rejects a question exceeding 2000 characters", () => {
    const result = addQuestionSchema.safeParse({ question: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("accepts a question at the 2000 character limit", () => {
    const result = addQuestionSchema.safeParse({ question: "a".repeat(2000) });
    expect(result.success).toBe(true);
  });
});
