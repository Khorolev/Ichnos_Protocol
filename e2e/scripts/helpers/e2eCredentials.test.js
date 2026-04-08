import { describe, it, expect } from "vitest";
import { buildCredentialMaps } from "./e2eCredentials.js";

describe("buildCredentialMaps", () => {
  it("returns empty maps when no credentials are set", () => {
    const { github, vercel, firebaseCreds } = buildCredentialMaps({});

    expect(github).toEqual({});
    expect(vercel).toEqual({});
    expect(firebaseCreds).toEqual([]);
  });

  it("builds maps for admin-only input", () => {
    const env = {
      E2E_ADMIN_EMAIL: "admin@test.com",
      E2E_ADMIN_PASSWORD: "pass123",
      E2E_ADMIN_UID: "uid-admin",
    };

    const { github, vercel, firebaseCreds } = buildCredentialMaps(env);

    expect(github).toEqual({
      E2E_ADMIN_PASSWORD: "pass123",
    });
    expect(vercel).toEqual({
      E2E_ADMIN_EMAIL: "admin@test.com",
      E2E_ADMIN_UID: "uid-admin",
    });
    expect(firebaseCreds).toHaveLength(1);
    expect(firebaseCreds[0]).toEqual({
      email: "admin@test.com",
      password: "pass123",
      displayName: "E2E Admin",
      claims: { admin: true },
      uidKey: "E2E_ADMIN_UID",
    });
  });

  it("includes optional roles when their email is present", () => {
    const env = {
      E2E_ADMIN_EMAIL: "admin@test.com",
      E2E_ADMIN_PASSWORD: "adminpass",
      E2E_ADMIN_UID: "uid-admin",
      E2E_USER_EMAIL: "user@test.com",
      E2E_USER_PASSWORD: "userpass",
      E2E_USER_UID: "uid-user",
      E2E_SUPER_ADMIN_EMAIL: "super@test.com",
      E2E_SUPER_ADMIN_PASSWORD: "superpass",
      E2E_SUPER_ADMIN_UID: "uid-super",
    };

    const { github, vercel, firebaseCreds } = buildCredentialMaps(env);

    expect(Object.keys(github)).toEqual([
      "E2E_ADMIN_PASSWORD",
      "E2E_USER_PASSWORD",
      "E2E_SUPER_ADMIN_PASSWORD",
    ]);
    expect(Object.keys(vercel)).toEqual([
      "E2E_ADMIN_EMAIL", "E2E_ADMIN_UID",
      "E2E_USER_EMAIL", "E2E_USER_UID",
      "E2E_SUPER_ADMIN_EMAIL", "E2E_SUPER_ADMIN_UID",
    ]);
    expect(firebaseCreds).toHaveLength(3);
  });

  it("skips roles whose email is not set", () => {
    const env = {
      E2E_ADMIN_EMAIL: "admin@test.com",
      E2E_ADMIN_PASSWORD: "adminpass",
      E2E_ADMIN_UID: "uid-admin",
      E2E_USER_PASSWORD: "userpass",
      E2E_USER_UID: "uid-user",
    };

    const { github, vercel, firebaseCreds } = buildCredentialMaps(env);

    expect(github).not.toHaveProperty("E2E_USER_EMAIL");
    expect(vercel).not.toHaveProperty("E2E_USER_EMAIL");
    expect(firebaseCreds).toHaveLength(1);
  });

  it("maps UID keys correctly for Vercel payloads", () => {
    const env = {
      E2E_ADMIN_EMAIL: "a@t.com",
      E2E_ADMIN_PASSWORD: "p",
      E2E_ADMIN_UID: "uid-a",
      E2E_SUPER_ADMIN_EMAIL: "sa@t.com",
      E2E_SUPER_ADMIN_PASSWORD: "sp",
      E2E_SUPER_ADMIN_UID: "uid-sa",
    };

    const { vercel, firebaseCreds } = buildCredentialMaps(env);

    expect(vercel.E2E_ADMIN_UID).toBe("uid-a");
    expect(vercel.E2E_SUPER_ADMIN_UID).toBe("uid-sa");
    expect(firebaseCreds[0].uidKey).toBe("E2E_ADMIN_UID");
    expect(firebaseCreds[1].uidKey).toBe("E2E_SUPER_ADMIN_UID");
  });

  it("stores correct claims per role", () => {
    const env = {
      E2E_ADMIN_EMAIL: "a@t.com",
      E2E_ADMIN_PASSWORD: "p",
      E2E_ADMIN_UID: "u1",
      E2E_USER_EMAIL: "u@t.com",
      E2E_USER_PASSWORD: "p",
      E2E_USER_UID: "u2",
      E2E_SUPER_ADMIN_EMAIL: "sa@t.com",
      E2E_SUPER_ADMIN_PASSWORD: "p",
      E2E_SUPER_ADMIN_UID: "u3",
    };

    const { firebaseCreds } = buildCredentialMaps(env);

    const admin = firebaseCreds.find((c) => c.email === "a@t.com");
    const user = firebaseCreds.find((c) => c.email === "u@t.com");
    const superAdmin = firebaseCreds.find((c) => c.email === "sa@t.com");

    expect(admin.claims).toEqual({ admin: true });
    expect(user.claims).toEqual({});
    expect(superAdmin.claims).toEqual({ admin: true, superAdmin: true });
  });

  it("handles undefined password and UID gracefully", () => {
    const env = { E2E_ADMIN_EMAIL: "admin@test.com" };

    const { github, vercel, firebaseCreds } = buildCredentialMaps(env);

    expect(github.E2E_ADMIN_PASSWORD).toBeUndefined();
    expect(vercel.E2E_ADMIN_UID).toBeUndefined();
    expect(firebaseCreds[0].password).toBeUndefined();
  });
});
