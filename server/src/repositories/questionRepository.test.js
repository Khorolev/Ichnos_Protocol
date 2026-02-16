import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();

vi.mock("../config/database.js", () => ({
  default: { query: (...args) => mockQuery(...args) },
}));

const {
  createQuestion,
  getQuestionsByUserId,
  getChatHistoryByUserId,
  getDailyChatCount,
  createTopic,
  getTopicsByQuestionId,
  scrubQuestionPII,
} = await import("./questionRepository.js");

describe("questionRepository", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe("createQuestion", () => {
    it("inserts a question and returns the row", async () => {
      const row = { id: 1, question: "What is Ichnos?", source: "chat" };
      mockQuery.mockResolvedValue({ rows: [row] });

      const result = await createQuestion("uid-1", {
        question: "What is Ichnos?",
        source: "chat",
      });

      expect(result).toEqual(row);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO questions"),
        ["uid-1", "What is Ichnos?", null, "chat", null],
      );
    });

    it("passes answer and contactRequestId when provided", async () => {
      mockQuery.mockResolvedValue({ rows: [{}] });

      await createQuestion("uid-1", {
        question: "Q",
        answer: "A",
        source: "form",
        contactRequestId: 5,
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        ["uid-1", "Q", "A", "form", 5],
      );
    });
  });

  describe("getQuestionsByUserId", () => {
    it("returns questions ordered by created_at DESC", async () => {
      const rows = [{ id: 2 }, { id: 1 }];
      mockQuery.mockResolvedValue({ rows });

      const result = await getQuestionsByUserId("uid-1");
      expect(result).toEqual(rows);
    });
  });

  describe("getChatHistoryByUserId", () => {
    it("returns chat questions ordered by created_at ASC", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });

      const result = await getChatHistoryByUserId("uid-1");

      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("source = 'chat'"),
        ["uid-1"],
      );
    });
  });

  describe("getDailyChatCount", () => {
    it("returns the count of chat messages since a date", async () => {
      mockQuery.mockResolvedValue({ rows: [{ count: 5 }] });

      const result = await getDailyChatCount("uid-1", "2026-02-16T00:00:00Z");

      expect(result).toBe(5);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("COUNT(*)"),
        ["uid-1", "2026-02-16T00:00:00Z"],
      );
    });
  });

  describe("createTopic", () => {
    it("inserts a topic and returns the row", async () => {
      const row = { id: 1, topic: "battery", confidence: 0.95 };
      mockQuery.mockResolvedValue({ rows: [row] });

      const result = await createTopic(1, {
        topic: "battery",
        confidence: 0.95,
        model: "grok-2",
      });

      expect(result).toEqual(row);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO question_topics"),
        [1, "battery", 0.95, "grok-2"],
      );
    });
  });

  describe("getTopicsByQuestionId", () => {
    it("returns topics for a question", async () => {
      const rows = [{ id: 1, topic: "battery" }, { id: 2, topic: "passport" }];
      mockQuery.mockResolvedValue({ rows });

      const result = await getTopicsByQuestionId(1);
      expect(result).toEqual(rows);
    });
  });

  describe("scrubQuestionPII", () => {
    it("redacts emails, phones, and URLs from question and answer", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            question: "Contact me at john@example.com or +1234567890",
            answer: "Visit https://example.com for details",
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            question: "Contact me at [REDACTED_EMAIL] or [REDACTED_PHONE]",
            answer: "Visit [REDACTED_URL] for details",
          }],
        });

      const result = await scrubQuestionPII(1);

      expect(result.question).toContain("[REDACTED_EMAIL]");
      expect(result.question).toContain("[REDACTED_PHONE]");
      expect(result.answer).toContain("[REDACTED_URL]");
    });

    it("returns null when question does not exist", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await scrubQuestionPII(999);
      expect(result).toBeNull();
    });

    it("handles null answer gracefully", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ question: "Email: a@b.com", answer: null }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 1, question: "Email: [REDACTED_EMAIL]", answer: null }],
        });

      const result = await scrubQuestionPII(1);

      expect(result.question).toContain("[REDACTED_EMAIL]");
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        [1, "Email: [REDACTED_EMAIL]", null],
      );
    });
  });

  describe("error handling", () => {
    it("createQuestion logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("FK constraint"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        createQuestion("uid-1", { question: "Q", source: "chat" }),
      ).rejects.toThrow("FK constraint");
      expect(spy).toHaveBeenCalledWith(
        "questionRepository.createQuestion failed:",
        "FK constraint",
      );
      spy.mockRestore();
    });

    it("getDailyChatCount logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("timeout"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        getDailyChatCount("uid-1", "2026-02-16T00:00:00Z"),
      ).rejects.toThrow("timeout");
      expect(spy).toHaveBeenCalledWith(
        "questionRepository.getDailyChatCount failed:",
        "timeout",
      );
      spy.mockRestore();
    });

    it("createTopic logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("invalid input"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        createTopic(1, { topic: "battery" }),
      ).rejects.toThrow("invalid input");
      expect(spy).toHaveBeenCalledWith(
        "questionRepository.createTopic failed:",
        "invalid input",
      );
      spy.mockRestore();
    });

    it("scrubQuestionPII logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("connection refused"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(scrubQuestionPII(1)).rejects.toThrow("connection refused");
      expect(spy).toHaveBeenCalledWith(
        "questionRepository.scrubQuestionPII failed:",
        "connection refused",
      );
      spy.mockRestore();
    });
  });
});
