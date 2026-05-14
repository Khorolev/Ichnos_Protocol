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

const { getChatHistory, extractKeywords } = await import(
  "./chatService.js"
);

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
