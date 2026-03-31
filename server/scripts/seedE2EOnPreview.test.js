import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mockQuery = vi.fn();
const mockPoolEnd = vi.fn();
const mockPoolConstructor = vi.fn(function () {
  this.query = mockQuery;
  this.end = mockPoolEnd;
});

vi.mock("pg", () => ({ default: { Pool: mockPoolConstructor } }));

vi.mock("../src/config/firebase.js", () => ({
  default: {
    auth: () => ({ verifyIdToken: vi.fn() }),
    firestore: () => ({
      collection: () => ({
        where: () => ({
          where: () => ({ limit: () => ({ get: () => ({ docs: [] }) }) }),
          limit: () => ({ get: () => Promise.resolve({ docs: [] }) }),
        }),
        limit: () => ({ get: () => Promise.resolve({ docs: [] }) }),
      }),
    }),
  },
  storage: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({
  default: { query: vi.fn() },
}));

vi.mock("../src/repositories/knowledgeRepository.js", () => ({
  queryKnowledgeBase: vi.fn().mockResolvedValue([]),
}));

globalThis.fetch = vi.fn();

const { seedE2EOnPreview, resetSeedState, seedStatus } = await import(
  "./seedE2EOnPreview.js"
);
const { default: app } = await import("../src/app.js");

describe("seedE2EOnPreview", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetSeedState();
    process.env.VERCEL_ENV = "preview";
    process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
    process.env.E2E_ADMIN_EMAIL = "admin@test.com";
    process.env.E2E_ADMIN_UID = "admin-uid";
    delete process.env.E2E_USER_EMAIL;
    delete process.env.E2E_USER_UID;
    delete process.env.E2E_SUPER_ADMIN_EMAIL;
    delete process.env.E2E_SUPER_ADMIN_UID;
    delete process.env.SKIP_E2E_SEED;
  });

  it("skips seeding when VERCEL_ENV is production", async () => {
    process.env.VERCEL_ENV = "production";

    await seedE2EOnPreview();

    expect(mockPoolConstructor).not.toHaveBeenCalled();
    expect(seedStatus.mode).toBe("skipped");
  });

  it("skips seeding when VERCEL_ENV is unset", async () => {
    delete process.env.VERCEL_ENV;

    await seedE2EOnPreview();

    expect(mockPoolConstructor).not.toHaveBeenCalled();
    expect(seedStatus.mode).toBe("skipped");
  });

  it("skips seeding when E2E_ADMIN_UID is missing", async () => {
    delete process.env.E2E_ADMIN_UID;

    await seedE2EOnPreview();

    expect(mockPoolConstructor).not.toHaveBeenCalled();
  });

  it("skips seeding when E2E_ADMIN_EMAIL is missing", async () => {
    delete process.env.E2E_ADMIN_EMAIL;

    await seedE2EOnPreview();

    expect(mockPoolConstructor).not.toHaveBeenCalled();
  });

  it("seeds admin user and contact request with only required vars", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ok: 1 }] }) // SELECT 1 connectivity test
      .mockResolvedValueOnce({ rows: [] }) // upsertUser: INSERT users
      .mockResolvedValueOnce({ rows: [] }) // upsertUser: INSERT user_profiles
      .mockResolvedValueOnce({ rows: [] }) // upsertContactRequest: SELECT
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // upsertContactRequest: INSERT
      .mockResolvedValueOnce({ rows: [] }); // upsertContactRequest: INSERT questions

    await seedE2EOnPreview();

    expect(mockQuery).toHaveBeenCalledTimes(6);
    expect(mockPoolEnd).toHaveBeenCalled();
  });

  it("seeds optional user when E2E_USER vars are set", async () => {
    process.env.E2E_USER_UID = "user-uid";
    process.env.E2E_USER_EMAIL = "user@test.com";

    mockQuery
      .mockResolvedValueOnce({ rows: [{ ok: 1 }] }) // SELECT 1 connectivity test
      .mockResolvedValueOnce({ rows: [] }) // upsertUser (user): INSERT users
      .mockResolvedValueOnce({ rows: [] }) // upsertUser (user): INSERT user_profiles
      .mockResolvedValueOnce({ rows: [] }) // upsertUser (admin): INSERT users
      .mockResolvedValueOnce({ rows: [] }) // upsertUser (admin): INSERT user_profiles
      .mockResolvedValueOnce({ rows: [] }) // upsertContactRequest: SELECT
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // upsertContactRequest: INSERT
      .mockResolvedValueOnce({ rows: [] }); // upsertContactRequest: INSERT questions

    await seedE2EOnPreview();

    expect(mockQuery).toHaveBeenCalledTimes(8);
    expect(mockPoolEnd).toHaveBeenCalled();
  });

  it("closes pool and resolves on DB error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("connection failed"));

    await seedE2EOnPreview();

    expect(mockPoolEnd).toHaveBeenCalled();
  });

  it("skips seeding when SKIP_E2E_SEED=true", async () => {
    process.env.SKIP_E2E_SEED = "true";

    await seedE2EOnPreview();

    expect(mockPoolConstructor).not.toHaveBeenCalled();
    expect(seedStatus.mode).toBe("skipped");
    expect(seedStatus.seeded).toBe(true);
    expect(seedStatus.error).toBeNull();
  });

  it("SKIP_E2E_SEED guard has priority over VERCEL_ENV", async () => {
    process.env.SKIP_E2E_SEED = "true";
    process.env.VERCEL_ENV = "preview";

    await seedE2EOnPreview();

    expect(mockPoolConstructor).not.toHaveBeenCalled();
    expect(seedStatus.mode).toBe("skipped");
  });

  it("sets mode to failed when required vars are missing", async () => {
    delete process.env.E2E_ADMIN_UID;

    await seedE2EOnPreview();

    expect(seedStatus.mode).toBe("failed");
    expect(seedStatus.error).toBeTruthy();
  });

  it("sets mode to seeded on successful seed", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ok: 1 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    await seedE2EOnPreview();

    expect(seedStatus.mode).toBe("seeded");
    expect(seedStatus.seeded).toBe(true);
  });

  it("sets mode to failed on non-transient DB error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("permission denied"));

    await seedE2EOnPreview();

    expect(seedStatus.mode).toBe("failed");
    expect(seedStatus.seeded).toBe(false);
  });

  it("retries on transient timeout without premature mode=failed", async () => {
    vi.useFakeTimers();

    mockQuery
      .mockRejectedValueOnce(new Error("Connection timed out"))
      .mockImplementationOnce(() => {
        expect(seedStatus.mode).toBe("in_progress");
        return { rows: [{ ok: 1 }] };
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    const promise = seedE2EOnPreview();
    await vi.advanceTimersByTimeAsync(5000);
    await promise;

    expect(seedStatus.mode).toBe("seeded");
    expect(seedStatus.attempts).toBe(2);
    expect(seedStatus.seeded).toBe(true);

    vi.useRealTimers();
  });
});

describe("GET /api/health — seed contract", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetSeedState();
    process.env.VERCEL_ENV = "preview";
    process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
    process.env.E2E_ADMIN_EMAIL = "admin@test.com";
    process.env.E2E_ADMIN_UID = "admin-uid";
    delete process.env.E2E_USER_EMAIL;
    delete process.env.E2E_USER_UID;
    delete process.env.E2E_SUPER_ADMIN_EMAIL;
    delete process.env.E2E_SUPER_ADMIN_UID;
    delete process.env.SKIP_E2E_SEED;
  });

  it("includes seed.seeded, seed.error, seed.attempts, seed.mode on success", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ok: 1 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/api/health").expect(200);

    expect(res.body.seed).toEqual({
      seeded: true,
      error: null,
      attempts: 1,
      mode: "seeded",
    });
  });

  it("returns mode=skipped when SKIP_E2E_SEED=true", async () => {
    process.env.SKIP_E2E_SEED = "true";

    const res = await request(app).get("/api/health").expect(200);

    expect(res.body.seed).toEqual({
      seeded: true,
      error: null,
      attempts: 0,
      mode: "skipped",
    });
  });

  it("returns mode=failed when required env vars are missing", async () => {
    delete process.env.E2E_ADMIN_UID;

    const res = await request(app).get("/api/health").expect(200);

    expect(res.body.seed.mode).toBe("failed");
    expect(res.body.seed.seeded).toBe(false);
    expect(res.body.seed.error).toMatch(/E2E_ADMIN_UID/);
    expect(res.body.seed).toHaveProperty("attempts");
  });

  it("returns mode=failed on DB connection error", async () => {
    mockQuery.mockRejectedValue(new Error("permission denied"));

    const res = await request(app).get("/api/health").expect(200);

    expect(res.body.seed.mode).toBe("failed");
    expect(res.body.seed.seeded).toBe(false);
    expect(res.body.seed.error).toBe("permission denied");
    expect(res.body.seed).toHaveProperty("attempts");
  });
});
