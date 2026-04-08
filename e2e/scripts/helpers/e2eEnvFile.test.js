import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mergeEnvPasswords } from "./e2eEnvFile.js";

describe("mergeEnvPasswords", () => {
  const savedEnv = {};

  beforeEach(() => {
    savedEnv.ADMIN = process.env.E2E_ADMIN_PASSWORD;
    savedEnv.USER = process.env.E2E_USER_PASSWORD;
    delete process.env.E2E_ADMIN_PASSWORD;
    delete process.env.E2E_USER_PASSWORD;
  });

  afterEach(() => {
    if (savedEnv.ADMIN !== undefined) {
      process.env.E2E_ADMIN_PASSWORD = savedEnv.ADMIN;
    } else {
      delete process.env.E2E_ADMIN_PASSWORD;
    }
    if (savedEnv.USER !== undefined) {
      process.env.E2E_USER_PASSWORD = savedEnv.USER;
    } else {
      delete process.env.E2E_USER_PASSWORD;
    }
  });

  it("returns file env unchanged when no passwords in process.env", () => {
    const fileEnv = { E2E_ADMIN_EMAIL: "a@test.com", FIREBASE_API_KEY: "key" };
    const result = mergeEnvPasswords(fileEnv);
    expect(result).toEqual(fileEnv);
  });

  it("merges shell-exported password into file env", () => {
    process.env.E2E_ADMIN_PASSWORD = "shell-pass";
    const fileEnv = { E2E_ADMIN_EMAIL: "a@test.com" };
    const result = mergeEnvPasswords(fileEnv);
    expect(result.E2E_ADMIN_PASSWORD).toBe("shell-pass");
    expect(result.E2E_ADMIN_EMAIL).toBe("a@test.com");
  });

  it("shell password overrides file password", () => {
    process.env.E2E_ADMIN_PASSWORD = "shell-pass";
    const fileEnv = {
      E2E_ADMIN_EMAIL: "a@test.com",
      E2E_ADMIN_PASSWORD: "file-pass",
    };
    const result = mergeEnvPasswords(fileEnv);
    expect(result.E2E_ADMIN_PASSWORD).toBe("shell-pass");
  });

  it("does not merge non-password keys from process.env", () => {
    process.env.E2E_ADMIN_PASSWORD = "shell-pass";
    const fileEnv = { E2E_ADMIN_EMAIL: "a@test.com" };
    const result = mergeEnvPasswords(fileEnv);
    expect(result).not.toHaveProperty("PATH");
    expect(result).not.toHaveProperty("HOME");
  });

  it("merges multiple password keys", () => {
    process.env.E2E_ADMIN_PASSWORD = "admin-pass";
    process.env.E2E_USER_PASSWORD = "user-pass";
    const fileEnv = { E2E_ADMIN_EMAIL: "a@test.com" };
    const result = mergeEnvPasswords(fileEnv);
    expect(result.E2E_ADMIN_PASSWORD).toBe("admin-pass");
    expect(result.E2E_USER_PASSWORD).toBe("user-pass");
  });

  it("does not mutate the original file env object", () => {
    process.env.E2E_ADMIN_PASSWORD = "shell-pass";
    const fileEnv = { E2E_ADMIN_EMAIL: "a@test.com" };
    mergeEnvPasswords(fileEnv);
    expect(fileEnv).not.toHaveProperty("E2E_ADMIN_PASSWORD");
  });

  it("ignores empty-string password in process.env", () => {
    process.env.E2E_ADMIN_PASSWORD = "";
    const fileEnv = { E2E_ADMIN_PASSWORD: "file-pass" };
    const result = mergeEnvPasswords(fileEnv);
    expect(result.E2E_ADMIN_PASSWORD).toBe("file-pass");
  });
});
