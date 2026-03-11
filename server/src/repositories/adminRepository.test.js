import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();

vi.mock("../config/database.js", () => ({
  default: { query: (...args) => mockQuery(...args) },
}));

const {
  getUsersWithRequests,
  getRequestsWithQuestionsByUserId,
  getChatOnlyUsers,
  getChatMessagesByUserId,
  getInactiveUsers,
  getRecentInquiries,
  getRecentChatOnlyLeads,
} = await import("./adminRepository.js");

describe("adminRepository", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe("getUsersWithRequests", () => {
    it("returns users with request counts", async () => {
      const rows = [
        { userId: "uid-1", name: "Alice", totalRequests: 3, lastActivity: "2026-01-01" },
      ];
      mockQuery.mockResolvedValue({ rows });

      const result = await getUsersWithRequests();

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("JOIN contact_requests"),
      );
    });

    it("logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("connection failed"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(getUsersWithRequests()).rejects.toThrow("connection failed");
      expect(spy).toHaveBeenCalledWith(
        "adminRepository.getUsersWithRequests failed:",
        "connection failed",
      );
      spy.mockRestore();
    });
  });

  describe("getRequestsWithQuestionsByUserId", () => {
    it("returns requests with questions array and questionPreview", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, user_id: "uid-1" }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 10,
              question: "Hello?",
              answer: null,
              source: "form",
              created_at: "2026-01-01",
              contact_request_id: 1,
            },
          ],
        });

      const result = await getRequestsWithQuestionsByUserId("uid-1");

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(result[0].questionPreview).toBe("Hello?");
      expect(result[0].questions).toHaveLength(1);
      expect(result[0].questions[0].id).toBe(10);
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("ANY"),
        [[1]],
      );
    });

    it("logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("timeout"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        getRequestsWithQuestionsByUserId("uid-1"),
      ).rejects.toThrow("timeout");
      expect(spy).toHaveBeenCalledWith(
        "adminRepository.getRequestsWithQuestionsByUserId failed:",
        "timeout",
      );
      spy.mockRestore();
    });
  });

  describe("getChatOnlyUsers", () => {
    it("returns users without contact requests", async () => {
      const rows = [
        { userId: "uid-2", name: "Bob", totalMessages: 5, lastActivity: "2026-02-01" },
      ];
      mockQuery.mockResolvedValue({ rows });

      const result = await getChatOnlyUsers();

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("NOT IN"),
      );
    });

    it("logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("permission denied"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(getChatOnlyUsers()).rejects.toThrow("permission denied");
      expect(spy).toHaveBeenCalledWith(
        "adminRepository.getChatOnlyUsers failed:",
        "permission denied",
      );
      spy.mockRestore();
    });
  });

  describe("getChatMessagesByUserId", () => {
    it("returns messages ordered by created_at ASC", async () => {
      const rows = [
        { id: 1, question: "Hi", answer: "Hello", created_at: "2026-01-01" },
        { id: 2, question: "Help", answer: "Sure", created_at: "2026-01-02" },
      ];
      mockQuery.mockResolvedValue({ rows });

      const result = await getChatMessagesByUserId("uid-1");

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY created_at ASC"),
        ["uid-1"],
      );
    });

    it("logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("syntax error"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(getChatMessagesByUserId("uid-1")).rejects.toThrow("syntax error");
      expect(spy).toHaveBeenCalledWith(
        "adminRepository.getChatMessagesByUserId failed:",
        "syntax error",
      );
      spy.mockRestore();
    });
  });

  describe("getInactiveUsers", () => {
    it("returns users inactive for 24 months", async () => {
      const rows = [{ firebase_uid: "uid-old" }];
      mockQuery.mockResolvedValue({ rows });

      const result = await getInactiveUsers();

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '24 months'"),
      );
    });

    it("logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("db down"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(getInactiveUsers()).rejects.toThrow("db down");
      expect(spy).toHaveBeenCalledWith(
        "adminRepository.getInactiveUsers failed:",
        "db down",
      );
      spy.mockRestore();
    });
  });

  describe("getRecentInquiries", () => {
    it("returns inquiries from last 24 hours", async () => {
      const rows = [{ id: 1, name: "Alice", email: "a@b.com", status: "new" }];
      mockQuery.mockResolvedValue({ rows });

      const result = await getRecentInquiries();

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '24 hours'"),
      );
    });

    it("logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("timeout"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(getRecentInquiries()).rejects.toThrow("timeout");
      expect(spy).toHaveBeenCalledWith(
        "adminRepository.getRecentInquiries failed:",
        "timeout",
      );
      spy.mockRestore();
    });
  });

  describe("getRecentChatOnlyLeads", () => {
    it("returns chat-only leads from last 24 hours", async () => {
      const rows = [{ userId: "uid-new", name: "Bob", totalMessages: 3 }];
      mockQuery.mockResolvedValue({ rows });

      const result = await getRecentChatOnlyLeads();

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '24 hours'"),
      );
    });

    it("logs and rethrows on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("access denied"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(getRecentChatOnlyLeads()).rejects.toThrow("access denied");
      expect(spy).toHaveBeenCalledWith(
        "adminRepository.getRecentChatOnlyLeads failed:",
        "access denied",
      );
      spy.mockRestore();
    });
  });
});
