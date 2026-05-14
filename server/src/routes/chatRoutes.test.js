import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";

const mockVerifyIdToken = vi.fn();
const mockQuery = vi.fn();
const mockFetch = vi.fn();
const mockQueryKnowledgeBase = vi.fn();

vi.mock("@vercel/functions", () => ({ waitUntil: vi.fn() }));

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

function parseSSEFrames(text) {
  return text
    .split("\n\n")
    .filter((f) => f.trim())
    .map((frame) => {
      const lines = frame.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) return null;
      return {
        event: eventLine.slice(6).trim(),
        data: JSON.parse(dataLine.slice(5).trim()),
      };
    })
    .filter(Boolean);
}

function encodeXaiSSE(chunks) {
  const encoder = new TextEncoder();
  let index = 0;
  const frames = chunks.map((c) => {
    if (c === "[DONE]") return "data: [DONE]\n\n";
    return `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`;
  });
  const fullText = frames.join("");
  const encoded = encoder.encode(fullText);

  return {
    read() {
      if (index === 0) {
        index++;
        return Promise.resolve({ done: false, value: encoded });
      }
      return Promise.resolve({ done: true, value: undefined });
    },
  };
}

function xaiStreamResponse(chunks) {
  return {
    ok: true,
    body: { getReader: () => encodeXaiSSE(chunks) },
  };
}

function xaiErrorResponse(status) {
  return { ok: false, status };
}

describe("chat routes", () => {
  beforeEach(() => {
    vi.stubEnv("XAI_API_KEY", "test-key");
    mockVerifyIdToken.mockReset();
    mockQuery.mockReset();
    mockFetch.mockReset();
    mockQueryKnowledgeBase.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("POST /api/chat/message", () => {
    it("returns SSE stream with token and done events on success", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      // getDailyChatCount
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockQueryKnowledgeBase.mockResolvedValue([
        { content: "Battery passport info" },
      ]);
      // xAI streaming fetch
      mockFetch.mockResolvedValueOnce(
        xaiStreamResponse(["Hello", " world", "[DONE]"]),
      );
      // createQuestion INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "q-1" }] });
      // updateUserActivity
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // topic classification fetch (non-blocking)
      mockFetch.mockResolvedValueOnce(xaiResponse("battery"));
      // createTopic
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post("/api/chat/message")
        .set(authHeader())
        .send({ question: "Hello" })
        .buffer(true)
        .parse((res, cb) => {
          let data = "";
          res.on("data", (chunk) => { data += chunk.toString(); });
          res.on("end", () => cb(null, data));
        });

      expect(res.headers["content-type"]).toContain("text/event-stream");

      const frames = parseSSEFrames(res.body);
      const tokenFrames = frames.filter((f) => f.event === "token");
      const doneFrames = frames.filter((f) => f.event === "done");
      const errorFrames = frames.filter((f) => f.event === "error");

      // Zero error frames on success
      expect(errorFrames).toHaveLength(0);

      // At least one token frame with a delta
      expect(tokenFrames.length).toBeGreaterThanOrEqual(1);
      expect(tokenFrames[0].data).toHaveProperty("delta");

      // Exactly one done frame with both messageId and dailyCount
      expect(doneFrames).toHaveLength(1);
      expect(doneFrames[0].data).toHaveProperty("messageId");
      expect(doneFrames[0].data).toHaveProperty("dailyCount");

      // All token frames precede the done frame
      const lastTokenIdx = frames.findLastIndex((f) => f.event === "token");
      const doneIdx = frames.findIndex((f) => f.event === "done");
      expect(lastTokenIdx).toBeLessThan(doneIdx);
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

    it("returns SSE error event when xAI service is down", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      // getDailyChatCount
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockQueryKnowledgeBase.mockResolvedValue([]);
      // xAI returns 500
      mockFetch.mockResolvedValueOnce(xaiErrorResponse(500));

      const res = await request(app)
        .post("/api/chat/message")
        .set(authHeader())
        .send({ question: "Hello" })
        .buffer(true)
        .parse((res, cb) => {
          let data = "";
          res.on("data", (chunk) => { data += chunk.toString(); });
          res.on("end", () => cb(null, data));
        });

      const frames = parseSSEFrames(res.body);
      const errorFrames = frames.filter((f) => f.event === "error");

      expect(errorFrames).toHaveLength(1);
      expect(errorFrames[0].data.code).toBe("STREAM_ERROR");
      expect(errorFrames[0].data.message).toBe(
        "AI temporarily unavailable",
      );
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
