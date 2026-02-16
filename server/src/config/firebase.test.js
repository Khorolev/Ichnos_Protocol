import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Firebase Admin SDK Singleton", () => {
  beforeEach(() => {
    vi.resetModules();
    delete globalThis.__firebaseAdmin;

    vi.stubEnv("FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "test@test.iam.gserviceaccount.com");
  });

  it("initializes Firebase Admin and sets global singleton", async () => {
    const mockApp = { name: "[DEFAULT]" };
    const mockCert = vi.fn().mockReturnValue("mock-credential");
    const mockInitializeApp = vi.fn().mockReturnValue(mockApp);

    vi.doMock("firebase-admin", () => ({
      default: {
        initializeApp: mockInitializeApp,
        credential: { cert: mockCert },
      },
    }));

    await import("./firebase.js");

    expect(mockCert).toHaveBeenCalledWith({
      projectId: "test-project",
      privateKey: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n",
      clientEmail: "test@test.iam.gserviceaccount.com",
    });
    expect(mockInitializeApp).toHaveBeenCalledOnce();
    expect(globalThis.__firebaseAdmin).toBeDefined();
  });

  it("reuses existing singleton on subsequent imports", async () => {
    const existingAdmin = { auth: vi.fn() };
    globalThis.__firebaseAdmin = existingAdmin;

    const mockInitializeApp = vi.fn();
    vi.doMock("firebase-admin", () => ({
      default: {
        initializeApp: mockInitializeApp,
        credential: { cert: vi.fn() },
      },
    }));

    const { default: admin } = await import("./firebase.js");

    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(admin).toBe(existingAdmin);
  });

  it("throws and logs when initialization fails", async () => {
    const error = new Error("Invalid credential");
    const mockInitializeApp = vi.fn().mockImplementation(() => {
      throw error;
    });

    vi.doMock("firebase-admin", () => ({
      default: {
        initializeApp: mockInitializeApp,
        credential: { cert: vi.fn().mockReturnValue("mock-credential") },
      },
    }));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("./firebase.js")).rejects.toThrow("Invalid credential");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Firebase Admin SDK initialization failed:",
      "Invalid credential",
    );

    consoleSpy.mockRestore();
  });
});
