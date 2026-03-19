import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
const mockPoolEnd = vi.fn();
const mockPoolConstructor = vi.fn(function () {
  this.query = mockQuery;
  this.end = mockPoolEnd;
});

vi.mock("pg", () => ({ default: { Pool: mockPoolConstructor } }));

const { seedE2EOnPreview } = await import("./seedE2EOnPreview.js");

describe("seedE2EOnPreview", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.VERCEL_ENV = "preview";
    process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
    process.env.E2E_ADMIN_EMAIL = "admin@test.com";
    process.env.E2E_ADMIN_UID = "admin-uid";
    delete process.env.E2E_USER_EMAIL;
    delete process.env.E2E_USER_UID;
    delete process.env.E2E_SUPER_ADMIN_EMAIL;
    delete process.env.E2E_SUPER_ADMIN_UID;
  });

  it("skips seeding when VERCEL_ENV is production", async () => {
    process.env.VERCEL_ENV = "production";

    await seedE2EOnPreview();

    expect(mockPoolConstructor).not.toHaveBeenCalled();
  });

  it("skips seeding when VERCEL_ENV is unset", async () => {
    delete process.env.VERCEL_ENV;

    await seedE2EOnPreview();

    expect(mockPoolConstructor).not.toHaveBeenCalled();
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
      .mockResolvedValueOnce({ rows: [] }) // upsertUser: INSERT users
      .mockResolvedValueOnce({ rows: [] }) // upsertUser: INSERT user_profiles
      .mockResolvedValueOnce({ rows: [] }) // upsertContactRequest: SELECT
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // upsertContactRequest: INSERT
      .mockResolvedValueOnce({ rows: [] }); // upsertContactRequest: INSERT questions

    await seedE2EOnPreview();

    expect(mockQuery).toHaveBeenCalledTimes(5);
    expect(mockPoolEnd).toHaveBeenCalled();
  });

  it("seeds optional user when E2E_USER vars are set", async () => {
    process.env.E2E_USER_UID = "user-uid";
    process.env.E2E_USER_EMAIL = "user@test.com";

    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // upsertUser (user): INSERT users
      .mockResolvedValueOnce({ rows: [] }) // upsertUser (user): INSERT user_profiles
      .mockResolvedValueOnce({ rows: [] }) // upsertUser (admin): INSERT users
      .mockResolvedValueOnce({ rows: [] }) // upsertUser (admin): INSERT user_profiles
      .mockResolvedValueOnce({ rows: [] }) // upsertContactRequest: SELECT
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // upsertContactRequest: INSERT
      .mockResolvedValueOnce({ rows: [] }); // upsertContactRequest: INSERT questions

    await seedE2EOnPreview();

    expect(mockQuery).toHaveBeenCalledTimes(7);
    expect(mockPoolEnd).toHaveBeenCalled();
  });

  it("closes pool and resolves on DB error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("connection failed"));

    await seedE2EOnPreview();

    expect(mockPoolEnd).toHaveBeenCalled();
  });
});
