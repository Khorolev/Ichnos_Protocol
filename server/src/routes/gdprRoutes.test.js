import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mockVerifyIdToken = vi.fn();
const mockDeleteUser = vi.fn();
const mockQuery = vi.fn();

vi.mock("../config/firebase.js", () => ({
  default: {
    auth: () => ({
      verifyIdToken: mockVerifyIdToken,
      deleteUser: (...args) => mockDeleteUser(...args),
    }),
    firestore: () => ({
      collection: () => ({
        where: () => ({
          where: () => ({
            limit: () => ({ get: () => ({ docs: [] }) }),
          }),
          limit: () => ({ get: () => Promise.resolve({ docs: [] }) }),
        }),
        limit: () => ({ get: () => Promise.resolve({ docs: [] }) }),
      }),
    }),
  },
}));

vi.mock("../config/database.js", () => ({
  default: { query: (...args) => mockQuery(...args) },
}));

vi.mock("../repositories/knowledgeRepository.js", () => ({
  queryKnowledgeBase: vi.fn().mockResolvedValue([]),
}));

globalThis.fetch = vi.fn();

const { default: app } = await import("../app.js");

const decodedToken = { uid: "uid-1", email: "user@example.com" };

function authHeader() {
  return { Authorization: "Bearer valid-token" };
}

describe("GDPR routes", () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
    mockQuery.mockReset();
    mockDeleteUser.mockReset();
  });

  describe("GET /api/gdpr/download", () => {
    it("returns 200 with attachment header when authenticated", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              firebase_uid: "uid-1",
              created_at: "2026-01-01",
              name: "John",
              surname: "Doe",
              email: "john@test.com",
              phone: null,
              company: null,
              linkedin: null,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get("/api/gdpr/download")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.headers["content-disposition"]).toBe(
        "attachment; filename=my-data.json",
      );
      const body = JSON.parse(res.text);
      expect(body).toHaveProperty("user");
      expect(body).toHaveProperty("profile");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app).get("/api/gdpr/download");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/gdpr/delete", () => {
    it("returns 200 with deleted true when confirmed", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 });
      mockDeleteUser.mockResolvedValue();

      const res = await request(app)
        .post("/api/gdpr/delete")
        .set(authHeader())
        .send({ confirm: true });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ deleted: true });
      expect(res.body.message).toBe("Account deleted");
    });

    it("returns 400 when confirm is false", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .post("/api/gdpr/delete")
        .set(authHeader())
        .send({ confirm: false });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 400 when confirm field is missing", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .post("/api/gdpr/delete")
        .set(authHeader())
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/gdpr/delete")
        .send({ confirm: true });

      expect(res.status).toBe(401);
    });
  });
});
