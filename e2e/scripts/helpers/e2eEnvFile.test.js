import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { mergeEnvPasswords, writeUidsToEnvFile } from "./e2eEnvFile.js";

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

describe("writeUidsToEnvFile", () => {
  let tmpDir;
  let tmpFile;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "e2e-env-"));
    tmpFile = join(tmpDir, ".env.e2e");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes the INCOMPLETE_USER UID back while preserving its inline comment", () => {
    const initial = [
      "E2E_ADMIN_UID=old-admin",
      "E2E_INCOMPLETE_USER_UID=                # To be filled after Firebase provisioning",
      "",
    ].join("\n");
    writeFileSync(tmpFile, initial, "utf8");

    writeUidsToEnvFile(tmpFile, {
      E2E_ADMIN_UID: "new-admin",
      E2E_INCOMPLETE_USER_UID: "incomplete-uid-123",
    });

    const result = readFileSync(tmpFile, "utf8");
    expect(result).toContain("E2E_ADMIN_UID=new-admin");
    expect(result).toContain(
      "E2E_INCOMPLETE_USER_UID=incomplete-uid-123 # To be filled after Firebase provisioning",
    );
  });

  it("updates all known UID keys including INCOMPLETE_USER", () => {
    const initial = [
      "E2E_ADMIN_UID=a",
      "E2E_USER_UID=u",
      "E2E_INCOMPLETE_USER_UID=",
      "E2E_SUPER_ADMIN_UID=s",
      "E2E_MANAGE_ADMIN_TARGET_UID=m",
      "",
    ].join("\n");
    writeFileSync(tmpFile, initial, "utf8");

    writeUidsToEnvFile(tmpFile, {
      E2E_ADMIN_UID: "uid-a",
      E2E_USER_UID: "uid-u",
      E2E_INCOMPLETE_USER_UID: "uid-i",
      E2E_SUPER_ADMIN_UID: "uid-s",
      E2E_MANAGE_ADMIN_TARGET_UID: "uid-m",
    });

    const result = readFileSync(tmpFile, "utf8");
    expect(result).toContain("E2E_ADMIN_UID=uid-a");
    expect(result).toContain("E2E_USER_UID=uid-u");
    expect(result).toContain("E2E_INCOMPLETE_USER_UID=uid-i");
    expect(result).toContain("E2E_SUPER_ADMIN_UID=uid-s");
    expect(result).toContain("E2E_MANAGE_ADMIN_TARGET_UID=uid-m");
  });

  it("leaves unrelated lines untouched", () => {
    const initial = [
      "FIREBASE_API_KEY=abc",
      "E2E_INCOMPLETE_USER_UID=                # comment here",
      "E2E_BASE_URL=https://example.com",
      "",
    ].join("\n");
    writeFileSync(tmpFile, initial, "utf8");

    writeUidsToEnvFile(tmpFile, { E2E_INCOMPLETE_USER_UID: "new-uid" });

    const result = readFileSync(tmpFile, "utf8");
    expect(result).toContain("FIREBASE_API_KEY=abc");
    expect(result).toContain("E2E_BASE_URL=https://example.com");
    expect(result).toContain("E2E_INCOMPLETE_USER_UID=new-uid # comment here");
  });
});
