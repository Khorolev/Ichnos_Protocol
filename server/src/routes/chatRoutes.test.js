import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mockVerifyIdToken = vi.fn();
const mockQuery = vi.fn();
const mockFetch = vi.fn();
const mockQueryKnowledgeBase = vi.fn();

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
  queryKnowledgeBase: (...args) => mockQueryKnowledgeBase(...args),
}));

globalThis.fetch = mockFetch;

const { default: app } = await import("../app.js");

const decodedToken = { uid: "uid-1", email: "user@example.com" };

function authHeader() {
  return { Authorization: "Bearer valid-token" };
}

function xaiResponse(content) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        choices: [{ message: { content } }],
      }),
  };
}

describe("chat routes", () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
    mockQuery.mockReset();
    mockFetch.mockReset();
    mockQueryKnowledgeBase.mockReset();
  });

  describe("POST /api/chat/message", () => {
    it("returns 200 with answer on success", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: 2 }] })
        .mockResolvedValueOnce({
          rows: [{ id: "q-1", question: "Hello", answer: "Hi there" }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });
      mockQueryKnowledgeBase.mockResolvedValue([]);
      mockFetch.mockResolvedValue(xaiResponse("Hi there"));

      const res = await request(app)
        .post("/api/chat/message")
        .set(authHeader())
        .send({ question: "Hello" });

      expect(res.status).toBe(200);
      expect(res.body.data.answer).toBe("Hi there");
      expect(res.body.data.messageId).toBe("q-1");
      expect(res.body.message).toBe("Message sent");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/chat/message")
        .send({ question: "Hello" });

      expect(res.status).toBe(401);
    });

    it("returns 400 when question is missing", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .post("/api/chat/message")
        .set(authHeader())
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 400 when question is empty", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .post("/api/chat/message")
        .set(authHeader())
        .send({ question: "" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 400 when question exceeds 2000 chars", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .post("/api/chat/message")
        .set(authHeader())
        .send({ question: "a".repeat(2001) });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 429 when rate limit exceeded", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 50 }] });

      const res = await request(app)
        .post("/api/chat/message")
        .set(authHeader())
        .send({ question: "Hello" });

      expect(res.status).toBe(429);
    });

    it("returns 503 when xAI service is down", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockQueryKnowledgeBase.mockResolvedValue([]);
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      const res = await request(app)
        .post("/api/chat/message")
        .set(authHeader())
        .send({ question: "Hello" });

      expect(res.status).toBe(503);
    });
  });

  describe("GET /api/chat/history", () => {
    it("returns 200 with chat history", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "q-1",
            question: "Hello",
            answer: "Hi",
            created_at: "2026-01-01T00:00:00Z",
            source: "chat",
            user_id: "uid-1",
          },
        ],
      });

      const res = await request(app)
        .get("/api/chat/history")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].question).toBe("Hello");
      expect(res.body.message).toBe("Chat history retrieved");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app).get("/api/chat/history");

      expect(res.status).toBe(401);
    });

    it("returns 200 with empty array when no history", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get("/api/chat/history")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
