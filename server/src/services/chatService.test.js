import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockGetDailyChatCount = vi.fn();
const mockCreateQuestion = vi.fn();
const mockGetChatHistoryByUserId = vi.fn();
const mockCreateTopic = vi.fn();
const mockQueryKnowledgeBase = vi.fn();
const mockUpdateUserActivity = vi.fn();

vi.mock("../repositories/questionRepository.js", () => ({
  getDailyChatCount: (...args) => mockGetDailyChatCount(...args),
  createQuestion: (...args) => mockCreateQuestion(...args),
  getChatHistoryByUserId: (...args) => mockGetChatHistoryByUserId(...args),
  createTopic: (...args) => mockCreateTopic(...args),
}));

vi.mock("../repositories/knowledgeRepository.js", () => ({
  queryKnowledgeBase: (...args) => mockQueryKnowledgeBase(...args),
}));

vi.mock("../repositories/userRepository.js", () => ({
  updateUserActivity: (...args) => mockUpdateUserActivity(...args),
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const { sendMessage, getChatHistory, extractKeywords } = await import(
  "./chatService.js"
);

function xaiResponse(content) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        choices: [{ message: { content } }],
      }),
  };
}

describe("chatService", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.XAI_API_KEY = "test-api-key";
    mockGetDailyChatCount.mockReset();
    mockCreateQuestion.mockReset();
    mockGetChatHistoryByUserId.mockReset();
    mockCreateTopic.mockReset();
    mockQueryKnowledgeBase.mockReset();
    mockUpdateUserActivity.mockReset();
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("extractKeywords", () => {
    it("extracts meaningful keywords from text", () => {
      const result = extractKeywords("What is the battery passport?");
      expect(result).toContain("battery");
      expect(result).toContain("passport");
      expect(result).not.toContain("what");
      expect(result).not.toContain("the");
    });

    it("returns at most 10 keywords", () => {
      const longText =
        "battery passport compliance regulation carbon footprint supply chain due diligence recycling manufacturing testing certification homologation";
      const result = extractKeywords(longText);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it("deduplicates keywords", () => {
      const result = extractKeywords("battery battery battery");
      expect(result).toEqual(["battery"]);
    });
  });

  describe("sendMessage", () => {
    it("returns answer and messageId on success", async () => {
      mockGetDailyChatCount.mockResolvedValue(2);
      mockQueryKnowledgeBase.mockResolvedValue([
        { content: "Battery passport info" },
      ]);
      mockFetch.mockResolvedValue(xaiResponse("Here is the answer"));
      mockCreateQuestion.mockResolvedValue({ id: "q-1" });
      mockUpdateUserActivity.mockResolvedValue();

      const result = await sendMessage("uid-1", "Tell me about passports");

      expect(result.answer).toBe("Here is the answer");
      expect(result.messageId).toBe("q-1");
      expect(result.dailyCount).toBe(3);
      expect(mockCreateQuestion).toHaveBeenCalledWith("uid-1", {
        question: "Tell me about passports",
        answer: "Here is the answer",
        source: "chat",
        contactRequestId: null,
      });
      expect(mockUpdateUserActivity).toHaveBeenCalledWith("uid-1");
    });

    it("throws 429 when daily limit is reached", async () => {
      mockGetDailyChatCount.mockResolvedValue(3);

      const error = await sendMessage("uid-1", "Hello").catch((e) => e);

      expect(error.message).toBe("Daily message limit reached (3/day)");
      expect(error.statusCode).toBe(429);
    });

    it("works without RAG context documents", async () => {
      mockGetDailyChatCount.mockResolvedValue(0);
      mockQueryKnowledgeBase.mockResolvedValue([]);
      mockFetch.mockResolvedValue(xaiResponse("Generic answer"));
      mockCreateQuestion.mockResolvedValue({ id: "q-2" });
      mockUpdateUserActivity.mockResolvedValue();

      const result = await sendMessage("uid-1", "Hello");

      expect(result.answer).toBe("Generic answer");
      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.messages[1].content).toContain("Question: Hello");
      expect(fetchBody.messages[1].content).not.toContain(
        "Relevant information",
      );
    });

    it("throws 503 when xAI API returns error", async () => {
      mockGetDailyChatCount.mockResolvedValue(0);
      mockQueryKnowledgeBase.mockResolvedValue([]);
      mockFetch.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve("Internal Server Error") });

      const error = await sendMessage("uid-1", "Tell me about batteries").catch(
        (e) => e,
      );

      expect(error.message).toBe("xAI API request failed");
      expect(error.statusCode).toBe(503);
    });

    it("throws 503 when xAI API is unreachable", async () => {
      mockGetDailyChatCount.mockResolvedValue(0);
      mockQueryKnowledgeBase.mockResolvedValue([]);
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(
        sendMessage("uid-1", "Tell me about batteries"),
      ).rejects.toThrow("xAI API unavailable");
    });

    it("skips documents with missing or empty content", async () => {
      mockGetDailyChatCount.mockResolvedValue(0);
      mockQueryKnowledgeBase.mockResolvedValue([
        { title: "No content field" },
        { content: "" },
        { content: null },
        { content: "   " },
        { content: "Valid document" },
      ]);
      mockFetch.mockResolvedValue(xaiResponse("Answer with partial context"));
      mockCreateQuestion.mockResolvedValue({ id: "q-partial" });
      mockUpdateUserActivity.mockResolvedValue();

      const result = await sendMessage("uid-1", "Tell me about passports");

      expect(result.answer).toBe("Answer with partial context");
      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.messages[1].content).toContain("Valid document");
      expect(fetchBody.messages[1].content).toContain("Relevant information");
    });

    it("treats all-empty content documents as no context", async () => {
      mockGetDailyChatCount.mockResolvedValue(0);
      mockQueryKnowledgeBase.mockResolvedValue([
        { title: "Missing" },
        { content: "" },
        { content: null },
      ]);
      mockFetch.mockResolvedValue(xaiResponse("No context answer"));
      mockCreateQuestion.mockResolvedValue({ id: "q-empty" });
      mockUpdateUserActivity.mockResolvedValue();

      const result = await sendMessage("uid-1", "Hello");

      expect(result.answer).toBe("No context answer");
      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.messages[1].content).not.toContain(
        "Relevant information",
      );
      expect(fetchBody.messages[1].content).toContain("Question: Hello");
    });

    it("includes RAG context in xAI request when documents found", async () => {
      mockGetDailyChatCount.mockResolvedValue(0);
      mockQueryKnowledgeBase.mockResolvedValue([
        { content: "Document A content" },
        { content: "Document B content" },
      ]);
      mockFetch.mockResolvedValue(xaiResponse("Contextual answer"));
      mockCreateQuestion.mockResolvedValue({ id: "q-3" });
      mockUpdateUserActivity.mockResolvedValue();

      await sendMessage("uid-1", "What about regulations?");

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(fetchBody.messages[1].content).toContain(
        "Relevant information",
      );
      expect(fetchBody.messages[1].content).toContain("Document A content");
      expect(fetchBody.messages[1].content).toContain("Document B content");
    });

    it("runs topic classification before returning", async () => {
      mockGetDailyChatCount.mockResolvedValue(0);
      mockQueryKnowledgeBase.mockResolvedValue([]);
      mockFetch
        .mockResolvedValueOnce(xaiResponse("Answer"))
        .mockResolvedValueOnce(xaiResponse("battery, compliance"));
      mockCreateQuestion.mockResolvedValue({ id: "q-4" });
      mockUpdateUserActivity.mockResolvedValue();
      mockCreateTopic.mockResolvedValue({});

      const result = await sendMessage("uid-1", "Battery regulation?");

      expect(result.answer).toBe("Answer");
      expect(mockCreateTopic).toHaveBeenCalled();
    });

    it("does not fail when topic classification errors", async () => {
      mockGetDailyChatCount.mockResolvedValue(0);
      mockQueryKnowledgeBase.mockResolvedValue([]);
      mockFetch
        .mockResolvedValueOnce(xaiResponse("Answer"))
        .mockRejectedValueOnce(new Error("Topic API down"));
      mockCreateQuestion.mockResolvedValue({ id: "q-5" });
      mockUpdateUserActivity.mockResolvedValue();

      const result = await sendMessage("uid-1", "Hello");

      expect(result.answer).toBe("Answer");
      expect(result.messageId).toBe("q-5");
    });
  });

  describe("getChatHistory", () => {
    it("returns formatted chat history", async () => {
      mockGetChatHistoryByUserId.mockResolvedValue([
        {
          id: "q-1",
          question: "Hello",
          answer: "Hi there",
          created_at: "2026-01-01T00:00:00Z",
          source: "chat",
          user_id: "uid-1",
        },
        {
          id: "q-2",
          question: "What?",
          answer: "Info here",
          created_at: "2026-01-01T01:00:00Z",
          source: "chat",
          user_id: "uid-1",
        },
      ]);

      const result = await getChatHistory("uid-1");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "q-1",
        question: "Hello",
        answer: "Hi there",
        created_at: "2026-01-01T00:00:00Z",
      });
      expect(result[1].id).toBe("q-2");
    });

    it("returns empty array when no history", async () => {
      mockGetChatHistoryByUserId.mockResolvedValue([]);

      const result = await getChatHistory("uid-1");

      expect(result).toEqual([]);
    });
  });
});
