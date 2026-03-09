import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mockVerifyIdToken = vi.fn();
const mockQuery = vi.fn();

vi.mock("../config/firebase.js", () => ({
  default: {
    auth: () => ({
      verifyIdToken: mockVerifyIdToken,
    }),
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

describe("contact routes", () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
    mockQuery.mockReset();
  });

  describe("POST /api/contact/submit", () => {
    it("returns 201 on successful submission", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, user_id: "uid-1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 10, question: "My question" }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .post("/api/contact/submit")
        .set(authHeader())
        .send({
          questions: [{ text: "My question" }],
          consentTimestamp: "2026-01-01T00:00:00+00:00",
          consentVersion: "v1",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.questions).toHaveLength(1);
      expect(res.body.message).toBe("Contact request submitted");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/contact/submit")
        .send({
          questions: [{ text: "Q" }],
          consentTimestamp: "2026-01-01T00:00:00+00:00",
          consentVersion: "v1",
        });

      expect(res.status).toBe(401);
    });

    it("returns 400 with empty questions array", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .post("/api/contact/submit")
        .set(authHeader())
        .send({
          questions: [],
          consentTimestamp: "2026-01-01T00:00:00+00:00",
          consentVersion: "v1",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 400 when consentTimestamp is missing", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .post("/api/contact/submit")
        .set(authHeader())
        .send({
          questions: [{ text: "Q" }],
          consentVersion: "v1",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });
  });

  describe("GET /api/contact/my-requests", () => {
    it("returns 200 with requests array", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, user_id: "uid-1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 10, contact_request_id: 1 }],
        });

      const res = await request(app)
        .get("/api/contact/my-requests")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.message).toBe("Requests retrieved");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app).get("/api/contact/my-requests");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/contact/:id/question", () => {
    it("returns 201 on successful question addition", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, user_id: "uid-1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 30, question: "Follow-up" }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .post("/api/contact/1/question")
        .set(authHeader())
        .send({ question: "Follow-up" });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(30);
      expect(res.body.message).toBe("Question added");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/contact/1/question")
        .send({ question: "Q" });

      expect(res.status).toBe(401);
    });

    it("returns 400 with empty question string", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .post("/api/contact/1/question")
        .set(authHeader())
        .send({ question: "" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 400 when question field is missing", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .post("/api/contact/1/question")
        .set(authHeader())
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });
  });
});
