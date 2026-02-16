import { describe, it, expect } from "vitest";
import { syncProfileSchema, updateProfileSchema } from "./authSchemas.js";

describe("syncProfileSchema", () => {
  const validProfile = {
    name: "John",
    surname: "Doe",
    email: "john@example.com",
  };

  it("accepts valid profile with required fields only", () => {
    const result = syncProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("accepts valid profile with all optional fields", () => {
    const result = syncProfileSchema.safeParse({
      ...validProfile,
      phone: "+1234567890",
      company: "Acme Corp",
      linkedin: "https://linkedin.com/in/johndoe",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = syncProfileSchema.safeParse({ surname: "Doe", email: "a@b.com" });
    expect(result.success).toBe(false);
  });

  it("rejects missing surname", () => {
    const result = syncProfileSchema.safeParse({ name: "John", email: "a@b.com" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = syncProfileSchema.safeParse({ name: "John", surname: "Doe" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = syncProfileSchema.safeParse({ ...validProfile, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid linkedin URL", () => {
    const result = syncProfileSchema.safeParse({ ...validProfile, linkedin: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding max length", () => {
    const result = syncProfileSchema.safeParse({ ...validProfile, name: "a".repeat(256) });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update with single field", () => {
    const result = updateProfileSchema.safeParse({ name: "Jane" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email when provided", () => {
    const result = updateProfileSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects empty name string when provided", () => {
    const result = updateProfileSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});
