import { describe, it, expect } from "vitest";
import {
  syncProfileSchema,
  updateProfileSchema,
  adminClaimSchema,
} from "./authSchemas.js";

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

  it("accepts empty object (all fields optional, none required)", () => {
    const result = syncProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts missing name (now optional)", () => {
    const result = syncProfileSchema.safeParse({
      surname: "Doe",
      email: "a@b.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing surname (now optional)", () => {
    const result = syncProfileSchema.safeParse({
      name: "John",
      email: "a@b.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing email (now optional)", () => {
    const result = syncProfileSchema.safeParse({
      name: "John",
      surname: "Doe",
    });
    expect(result.success).toBe(true);
  });

  it("accepts unknown legacy fields such as firebaseUid without error", () => {
    const result = syncProfileSchema.safeParse({ firebaseUid: "uid-1" });
    expect(result.success).toBe(true);
  });

  it("rejects empty-string name when provided", () => {
    const result = syncProfileSchema.safeParse({
      firebaseUid: "uid-1",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty-string surname when provided", () => {
    const result = syncProfileSchema.safeParse({
      firebaseUid: "uid-1",
      surname: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = syncProfileSchema.safeParse({
      ...validProfile,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid linkedin URL", () => {
    const result = syncProfileSchema.safeParse({
      ...validProfile,
      linkedin: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding max length", () => {
    const result = syncProfileSchema.safeParse({
      ...validProfile,
      name: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });
});

describe("adminClaimSchema", () => {
  it("accepts valid payload with isAdmin true", () => {
    const result = adminClaimSchema.safeParse({
      firebaseUid: "uid-1",
      isAdmin: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid payload with isAdmin false", () => {
    const result = adminClaimSchema.safeParse({
      firebaseUid: "uid-1",
      isAdmin: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing firebaseUid", () => {
    const result = adminClaimSchema.safeParse({ isAdmin: true });
    expect(result.success).toBe(false);
  });

  it("rejects missing isAdmin", () => {
    const result = adminClaimSchema.safeParse({ firebaseUid: "uid-1" });
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean isAdmin", () => {
    const result = adminClaimSchema.safeParse({
      firebaseUid: "uid-1",
      isAdmin: "yes",
    });
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
