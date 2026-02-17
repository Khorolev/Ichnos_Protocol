import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Firebase Admin SDK Singleton", () => {
  beforeEach(() => {
    vi.resetModules();
    delete globalThis.__firebaseAdmin;
    delete globalThis.__firebaseStorage;

    vi.stubEnv("FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "test@test.iam.gserviceaccount.com");
    vi.stubEnv("FIREBASE_STORAGE_BUCKET", "test-project.appspot.com");
  });

  it("initializes Firebase Admin and sets global singleton", async () => {
    const mockBucket = vi.fn().mockReturnValue({ name: "test-bucket" });
    const mockStorage = vi.fn().mockReturnValue({ bucket: mockBucket });
    const mockApp = { name: "[DEFAULT]" };
    const mockCert = vi.fn().mockReturnValue("mock-credential");
    const mockInitializeApp = vi.fn().mockReturnValue(mockApp);

    vi.doMock("firebase-admin", () => ({
      default: {
        initializeApp: mockInitializeApp,
        credential: { cert: mockCert },
        storage: mockStorage,
      },
    }));

    await import("./firebase.js");

    expect(mockCert).toHaveBeenCalledWith({
      projectId: "test-project",
      privateKey: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n",
      clientEmail: "test@test.iam.gserviceaccount.com",
    });
    expect(mockInitializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        storageBucket: "test-project.appspot.com",
      }),
    );
    expect(mockInitializeApp).toHaveBeenCalledOnce();
    expect(globalThis.__firebaseAdmin).toBeDefined();
    expect(globalThis.__firebaseStorage).toBeDefined();
    expect(mockBucket).toHaveBeenCalledWith("test-project.appspot.com");
  });

  it("reuses existing singleton on subsequent imports", async () => {
    const existingAdmin = {
      auth: vi.fn(),
      storage: vi.fn().mockReturnValue({ bucket: vi.fn() }),
    };
    const existingStorage = { name: "existing-bucket" };
    globalThis.__firebaseAdmin = existingAdmin;
    globalThis.__firebaseStorage = existingStorage;

    const mockInitializeApp = vi.fn();
    vi.doMock("firebase-admin", () => ({
      default: {
        initializeApp: mockInitializeApp,
        credential: { cert: vi.fn() },
      },
    }));

    const { default: admin, storage } = await import("./firebase.js");

    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(admin).toBe(existingAdmin);
    expect(storage).toBe(existingStorage);
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
        storage: vi.fn().mockReturnValue({ bucket: vi.fn() }),
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

  it("derives bucket name from FIREBASE_PROJECT_ID when FIREBASE_STORAGE_BUCKET is absent", async () => {
    vi.stubEnv("FIREBASE_STORAGE_BUCKET", "");

    const mockBucket = vi.fn().mockReturnValue({ name: "derived-bucket" });
    const mockStorage = vi.fn().mockReturnValue({ bucket: mockBucket });
    const mockInitializeApp = vi.fn();

    vi.doMock("firebase-admin", () => ({
      default: {
        initializeApp: mockInitializeApp,
        credential: { cert: vi.fn().mockReturnValue("mock-credential") },
        storage: mockStorage,
      },
    }));

    await import("./firebase.js");

    expect(mockInitializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        storageBucket: "test-project.appspot.com",
      }),
    );
    expect(mockBucket).toHaveBeenCalledWith("test-project.appspot.com");
  });

  it("throws when both FIREBASE_STORAGE_BUCKET and FIREBASE_PROJECT_ID are absent", async () => {
    vi.stubEnv("FIREBASE_STORAGE_BUCKET", "");
    vi.stubEnv("FIREBASE_PROJECT_ID", "");

    vi.doMock("firebase-admin", () => ({
      default: {
        initializeApp: vi.fn(),
        credential: { cert: vi.fn().mockReturnValue("mock-credential") },
        storage: vi.fn().mockReturnValue({ bucket: vi.fn() }),
      },
    }));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("./firebase.js")).rejects.toThrow(
      "FIREBASE_STORAGE_BUCKET is not set and FIREBASE_PROJECT_ID is unavailable to derive it.",
    );

    consoleSpy.mockRestore();
  });
});
