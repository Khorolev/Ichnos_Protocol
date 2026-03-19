import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mockQuery = vi.fn();
const mockPoolEnd = vi.fn();

vi.mock("pg", () => {
  const MockPool = vi.fn(function () {
    this.query = mockQuery;
    this.end = mockPoolEnd;
  });
  return { default: { Pool: MockPool } };
});

vi.mock("../config/firebase.js", () => ({
  default: {
    auth: () => ({
      verifyIdToken: vi.fn(),
      getUser: vi.fn(),
      setCustomUserClaims: vi.fn(),
    }),
  },
}));

vi.mock("../config/database.js", () => ({
  default: { query: vi.fn() },
}));

const { default: app } = await import("../app.js");

describe("E2E seed routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.VERCEL_ENV = "preview";
    process.env.E2E_SEED_TOKEN = "test-secret";
  });

  describe("POST /api/e2e/seed", () => {
    it("returns 403 in production environment", async () => {
      process.env.VERCEL_ENV = "production";

      const res = await request(app)
        .post("/api/e2e/seed")
        .set("Authorization", "Bearer test-secret")
        .send({ accounts: [{ uid: "u1", firstName: "A", lastName: "B", email: "a@b.com" }] });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Forbidden");
      expect(res.body.message).toBe("Not available in production");
      expect(mockPoolEnd).not.toHaveBeenCalled();
    });

    it("returns 403 without Authorization header", async () => {
      const res = await request(app)
        .post("/api/e2e/seed")
        .send({ accounts: [{ uid: "u1", firstName: "A", lastName: "B", email: "a@b.com" }] });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Forbidden");
      expect(res.body.message).toBe("Invalid or missing token");
      expect(mockPoolEnd).not.toHaveBeenCalled();
    });

    it("returns 403 with wrong token", async () => {
      const res = await request(app)
        .post("/api/e2e/seed")
        .set("Authorization", "Bearer wrong-token")
        .send({ accounts: [{ uid: "u1", firstName: "A", lastName: "B", email: "a@b.com" }] });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Forbidden");
      expect(mockPoolEnd).not.toHaveBeenCalled();
    });

    it("returns 400 when accounts field is missing", async () => {
      const res = await request(app)
        .post("/api/e2e/seed")
        .set("Authorization", "Bearer test-secret")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Bad Request");
      expect(mockPoolEnd).not.toHaveBeenCalled();
    });

    it("returns 400 when accounts array is empty", async () => {
      const res = await request(app)
        .post("/api/e2e/seed")
        .set("Authorization", "Bearer test-secret")
        .send({ accounts: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Bad Request");
      expect(mockPoolEnd).not.toHaveBeenCalled();
    });

    it("returns 200 on valid request with seedContactRequest", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // upsertUser: INSERT users
        .mockResolvedValueOnce({ rows: [] }) // upsertUser: INSERT user_profiles
        .mockResolvedValueOnce({ rows: [] }) // upsertContactRequest: SELECT
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // upsertContactRequest: INSERT
        .mockResolvedValueOnce({ rows: [] }); // upsertContactRequest: INSERT questions

      const res = await request(app)
        .post("/api/e2e/seed")
        .set("Authorization", "Bearer test-secret")
        .send({
          accounts: [{
            uid: "uid-1",
            firstName: "E2E",
            lastName: "Admin",
            email: "admin@test.com",
            seedContactRequest: true,
          }],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.seeded).toBe(1);
      expect(res.body.message).toBe("E2E seed complete");
      expect(mockPoolEnd).toHaveBeenCalled();

      expect(mockQuery).toHaveBeenCalledTimes(5);

      const [q1Sql, q1Params] = mockQuery.mock.calls[0];
      expect(q1Sql).toContain("INSERT INTO users");
      expect(q1Sql).toContain("ON CONFLICT (firebase_uid)");
      expect(q1Params).toEqual(["uid-1"]);

      const [q2Sql, q2Params] = mockQuery.mock.calls[1];
      expect(q2Sql).toContain("INSERT INTO user_profiles");
      expect(q2Sql).toContain("ON CONFLICT (user_id)");
      expect(q2Params).toEqual(["uid-1", "E2E", "Admin", "admin@test.com", "E2E Corp"]);

      const [q3Sql, q3Params] = mockQuery.mock.calls[2];
      expect(q3Sql).toContain("SELECT id FROM contact_requests");
      expect(q3Params).toEqual(["uid-1"]);

      const [q4Sql, q4Params] = mockQuery.mock.calls[3];
      expect(q4Sql).toContain("INSERT INTO contact_requests");
      expect(q4Sql).toContain("RETURNING id");
      expect(q4Params).toEqual(["uid-1"]);

      const [q5Sql, q5Params] = mockQuery.mock.calls[4];
      expect(q5Sql).toContain("INSERT INTO questions");
      expect(q5Sql).toContain("WHERE NOT EXISTS");
      expect(q5Params).toEqual(["uid-1", 1]);
    });

    it("returns 500 and closes pool on DB error", async () => {
      mockQuery.mockRejectedValueOnce(new Error("connection failed"));

      const res = await request(app)
        .post("/api/e2e/seed")
        .set("Authorization", "Bearer test-secret")
        .send({
          accounts: [{
            uid: "uid-1",
            firstName: "E2E",
            lastName: "User",
            email: "user@test.com",
          }],
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Seed failed");
      expect(mockPoolEnd).toHaveBeenCalled();
    });
  });
});
