import { describe, it, expect } from "vitest";
import { validateCredentials } from "./e2ePreflightValidators.js";

describe("validateCredentials", () => {
  const adminOnly = {
    E2E_ADMIN_EMAIL: "admin@test.com",
    E2E_ADMIN_PASSWORD: "pass123",
    E2E_ADMIN_UID: "uid-admin",
  };

  it("passes with valid admin-only credentials", () => {
    expect(() => validateCredentials(adminOnly, false)).not.toThrow();
  });

  it("throws when E2E_ADMIN_EMAIL is missing", () => {
    const env = { E2E_ADMIN_PASSWORD: "pass123" };
    expect(() => validateCredentials(env, false)).toThrow(
      /Admin credentials are required/,
    );
  });

  it("throws when E2E_ADMIN_PASSWORD is missing", () => {
    const env = { E2E_ADMIN_EMAIL: "admin@test.com" };
    expect(() => validateCredentials(env, false)).toThrow(
      /Admin credentials are required/,
    );
  });

  it("passes when optional role is fully configured", () => {
    const env = {
      ...adminOnly,
      E2E_USER_EMAIL: "user@test.com",
      E2E_USER_PASSWORD: "userpass",
    };
    expect(() => validateCredentials(env, false)).not.toThrow();
  });

  it("passes when optional role is completely absent", () => {
    expect(() => validateCredentials(adminOnly, false)).not.toThrow();
  });

  it("throws when optional role has UID only (partial)", () => {
    const env = { ...adminOnly, E2E_USER_UID: "uid-user" };
    expect(() => validateCredentials(env, false)).toThrow(
      /USER is partially configured/,
    );
  });

  it("throws when optional role has email but no password", () => {
    const env = { ...adminOnly, E2E_SUPER_ADMIN_EMAIL: "sa@test.com" };
    expect(() => validateCredentials(env, false)).toThrow(
      /SUPER_ADMIN is partially configured/,
    );
  });

  it("throws when optional role has password but no email", () => {
    const env = { ...adminOnly, E2E_USER_PASSWORD: "userpass" };
    expect(() => validateCredentials(env, false)).toThrow(
      /USER is partially configured/,
    );
  });

  describe("sync-only mode", () => {
    it("throws when E2E_ADMIN_UID is missing in sync-only", () => {
      const env = {
        E2E_ADMIN_EMAIL: "admin@test.com",
        E2E_ADMIN_PASSWORD: "pass123",
      };
      expect(() => validateCredentials(env, true)).toThrow(
        /E2E_ADMIN_UID is required for sync-only mode/,
      );
    });

    it("passes with admin UID in sync-only", () => {
      expect(() => validateCredentials(adminOnly, true)).not.toThrow();
    });

    it("throws when optional role is configured but UID missing in sync-only", () => {
      const env = {
        ...adminOnly,
        E2E_USER_EMAIL: "user@test.com",
        E2E_USER_PASSWORD: "userpass",
      };
      expect(() => validateCredentials(env, true)).toThrow(
        /E2E_USER_UID is required for sync-only mode/,
      );
    });

    it("passes when optional role has UID in sync-only", () => {
      const env = {
        ...adminOnly,
        E2E_USER_EMAIL: "user@test.com",
        E2E_USER_PASSWORD: "userpass",
        E2E_USER_UID: "uid-user",
      };
      expect(() => validateCredentials(env, true)).not.toThrow();
    });
  });
});
