import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateContactRequest = vi.fn();
const mockGetRequestsByUserId = vi.fn();
const mockGetRequestById = vi.fn();
const mockCreateQuestion = vi.fn();
const mockGetQuestionsByUserId = vi.fn();
const mockUpdateUserActivity = vi.fn();

vi.mock("../repositories/contactRepository.js", () => ({
  createContactRequest: (...args) => mockCreateContactRequest(...args),
  getRequestsByUserId: (...args) => mockGetRequestsByUserId(...args),
  getRequestById: (...args) => mockGetRequestById(...args),
}));

vi.mock("../repositories/questionRepository.js", () => ({
  createQuestion: (...args) => mockCreateQuestion(...args),
  getQuestionsByUserId: (...args) => mockGetQuestionsByUserId(...args),
}));

vi.mock("../repositories/userRepository.js", () => ({
  updateUserActivity: (...args) => mockUpdateUserActivity(...args),
}));

const { submitContactRequest, getMyRequests, addQuestion } = await import(
  "./contactService.js"
);

describe("contactService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitContactRequest", () => {
    it("creates request with a single question", async () => {
      mockCreateContactRequest.mockResolvedValue({ id: 1, user_id: "uid-1" });
      mockCreateQuestion.mockResolvedValue({ id: 10, question: "Q1" });
      mockUpdateUserActivity.mockResolvedValue();

      const result = await submitContactRequest("uid-1", {
        consentTimestamp: "2026-01-01T00:00:00Z",
        consentVersion: "v1",
        questions: [{ text: "Q1" }],
      });

      expect(result.id).toBe(1);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].question).toBe("Q1");
      expect(mockCreateQuestion).toHaveBeenCalledWith("uid-1", {
        question: "Q1",
        answer: null,
        source: "form",
        contactRequestId: 1,
      });
      expect(mockUpdateUserActivity).toHaveBeenCalledWith("uid-1");
    });

    it("creates request with multiple questions", async () => {
      mockCreateContactRequest.mockResolvedValue({ id: 2, user_id: "uid-1" });
      mockCreateQuestion
        .mockResolvedValueOnce({ id: 20, question: "Q1" })
        .mockResolvedValueOnce({ id: 21, question: "Q2" });
      mockUpdateUserActivity.mockResolvedValue();

      const result = await submitContactRequest("uid-1", {
        consentTimestamp: "2026-01-01T00:00:00Z",
        consentVersion: "v1",
        questions: [{ text: "Q1" }, { text: "Q2" }],
      });

      expect(result.questions).toHaveLength(2);
      expect(mockCreateQuestion).toHaveBeenCalledTimes(2);
    });
  });

  describe("getMyRequests", () => {
    it("returns requests with linked questions", async () => {
      mockGetRequestsByUserId.mockResolvedValue([
        { id: 1, user_id: "uid-1" },
        { id: 2, user_id: "uid-1" },
      ]);
      mockGetQuestionsByUserId.mockResolvedValue([
        { id: 10, contact_request_id: 1 },
        { id: 11, contact_request_id: 1 },
        { id: 12, contact_request_id: 2 },
      ]);

      const result = await getMyRequests("uid-1");

      expect(result).toHaveLength(2);
      expect(result[0].questions).toHaveLength(2);
      expect(result[1].questions).toHaveLength(1);
    });

    it("returns empty array when no requests", async () => {
      mockGetRequestsByUserId.mockResolvedValue([]);
      mockGetQuestionsByUserId.mockResolvedValue([]);

      const result = await getMyRequests("uid-1");

      expect(result).toEqual([]);
    });
  });

  describe("addQuestion", () => {
    it("creates a question for an owned request", async () => {
      mockGetRequestById.mockResolvedValue({ id: 1, user_id: "uid-1" });
      mockCreateQuestion.mockResolvedValue({ id: 30, question: "Follow-up" });
      mockUpdateUserActivity.mockResolvedValue();

      const result = await addQuestion("uid-1", 1, "Follow-up");

      expect(result.id).toBe(30);
      expect(mockCreateQuestion).toHaveBeenCalledWith("uid-1", {
        question: "Follow-up",
        answer: null,
        source: "form",
        contactRequestId: 1,
      });
      expect(mockUpdateUserActivity).toHaveBeenCalledWith("uid-1");
    });

    it("throws 404 when request not found", async () => {
      mockGetRequestById.mockResolvedValue(null);

      const error = await addQuestion("uid-1", 999, "Q").catch((e) => e);

      expect(error.message).toBe("Contact request not found");
      expect(error.statusCode).toBe(404);
    });

    it("throws 403 when request belongs to another user", async () => {
      mockGetRequestById.mockResolvedValue({ id: 1, user_id: "uid-other" });

      const error = await addQuestion("uid-1", 1, "Q").catch((e) => e);

      expect(error.message).toBe("Not authorized to add to this request");
      expect(error.statusCode).toBe(403);
    });
  });
});
