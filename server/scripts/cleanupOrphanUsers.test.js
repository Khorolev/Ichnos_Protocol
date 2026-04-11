import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();
const mockPoolEnd = vi.fn();
const mockPoolConstructor = vi.fn(function () {
  this.query = mockQuery;
  this.end = mockPoolEnd;
});

vi.mock("pg", () => ({ default: { Pool: mockPoolConstructor } }));

const { findOrphanUsers, deleteOrphanUsers, runAudit, runApply } = await import(
  "./cleanupOrphanUsers.js"
);

// CI-safe pattern: real-DB tests gated on TEST_DATABASE_URL.
// All tests below use the mocked pool, so this guard is a scaffold for any
// future integration tests against a real database.
const skip = !process.env.TEST_DATABASE_URL;
// eslint-disable-next-line no-unused-vars
const describeIf = skip ? describe.skip : describe;

function makePool() {
  return new mockPoolConstructor();
}

describe("findOrphanUsers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns rows and count when orphans exist", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ firebase_uid: "uid-1" }, { firebase_uid: "uid-2" }],
    });
    const pool = makePool();

    const result = await findOrphanUsers(pool);

    expect(result.count).toBe(2);
    expect(result.rows).toEqual([
      { firebase_uid: "uid-1" },
      { firebase_uid: "uid-2" },
    ]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/LEFT JOIN user_profiles/);
    expect(sql).toMatch(/IS NULL/);
  });

  it("returns empty rows and count=0 when no orphans exist", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const pool = makePool();

    const result = await findOrphanUsers(pool);

    expect(result.count).toBe(0);
    expect(result.rows).toEqual([]);
  });
});

describe("deleteOrphanUsers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("issues parameterized DELETE with firebase_uid = ANY($1)", async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 2 });
    const pool = makePool();

    const result = await deleteOrphanUsers(pool, ["uid-1", "uid-2"]);

    expect(result.deletedCount).toBe(2);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/DELETE FROM users WHERE firebase_uid = ANY\(\$1\)/);
    expect(params).toEqual([["uid-1", "uid-2"]]);
  });

  it("returns deletedCount from query result rowCount", async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 5 });
    const pool = makePool();

    const result = await deleteOrphanUsers(pool, ["a", "b", "c", "d", "e"]);

    expect(result.deletedCount).toBe(5);
  });

  it("returns deletedCount=0 without issuing a query when uids array is empty", async () => {
    const pool = makePool();

    const result = await deleteOrphanUsers(pool, []);

    expect(result.deletedCount).toBe(0);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe("runAudit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls findOrphanUsers and does NOT issue a DELETE", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ firebase_uid: "uid-1" }],
    });
    const pool = makePool();

    const result = await runAudit(pool);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/SELECT/);
    expect(sql).not.toMatch(/DELETE/);
    expect(result.count).toBe(1);
    expect(result.rows).toEqual([{ firebase_uid: "uid-1" }]);
  });

  it("returns empty audit result when no orphans exist", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const pool = makePool();

    const result = await runAudit(pool);

    expect(result.count).toBe(0);
    expect(result.rows).toEqual([]);
  });
});

describe("runApply", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls SELECT then DELETE when orphans exist, passing array to DELETE", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ firebase_uid: "uid-1" }, { firebase_uid: "uid-2" }],
      })
      .mockResolvedValueOnce({ rowCount: 2 });
    const pool = makePool();

    const result = await runApply(pool);

    expect(mockQuery).toHaveBeenCalledTimes(2);
    const [selectSql] = mockQuery.mock.calls[0];
    const [deleteSql, deleteParams] = mockQuery.mock.calls[1];
    expect(selectSql).toMatch(/SELECT/);
    expect(deleteSql).toMatch(/DELETE FROM users WHERE firebase_uid = ANY\(\$1\)/);
    expect(deleteParams).toEqual([["uid-1", "uid-2"]]);
    expect(result.deletedCount).toBe(2);
  });

  it("does NOT call DELETE when no orphans exist and returns deletedCount=0", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const pool = makePool();

    const result = await runApply(pool);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/SELECT/);
    expect(result.deletedCount).toBe(0);
  });
});
