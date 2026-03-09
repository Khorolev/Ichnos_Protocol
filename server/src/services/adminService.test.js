import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUsersWithRequests = vi.fn();
const mockGetRequestsWithQuestionsByUserId = vi.fn();
const mockGetChatOnlyUsers = vi.fn();
const mockGetChatMessagesByUserId = vi.fn();
const mockGetUncategorizedQuestions = vi.fn();
const mockGetTopicAggregates = vi.fn();
const mockGetAllDataForExport = vi.fn();
const mockGetInactiveUsers = vi.fn();
const mockGetRecentInquiries = vi.fn();
const mockGetRecentChatOnlyLeads = vi.fn();
const mockUpdateRequest = vi.fn();
const mockDeleteRequest = vi.fn();
const mockCreateTopic = vi.fn();
const mockCallXaiApi = vi.fn();
const mockGetUserByEmail = vi.fn();
const mockSetCustomUserClaims = vi.fn();
const mockDeleteUserAccount = vi.fn();
const mockResendSend = vi.fn();

vi.mock("../repositories/adminRepository.js", () => ({
  getUsersWithRequests: (...args) => mockGetUsersWithRequests(...args),
  getRequestsWithQuestionsByUserId: (...args) =>
    mockGetRequestsWithQuestionsByUserId(...args),
  getChatOnlyUsers: (...args) => mockGetChatOnlyUsers(...args),
  getChatMessagesByUserId: (...args) => mockGetChatMessagesByUserId(...args),
  getUncategorizedQuestions: (...args) =>
    mockGetUncategorizedQuestions(...args),
  getTopicAggregates: (...args) => mockGetTopicAggregates(...args),
  getAllDataForExport: (...args) => mockGetAllDataForExport(...args),
  getInactiveUsers: (...args) => mockGetInactiveUsers(...args),
  getRecentInquiries: (...args) => mockGetRecentInquiries(...args),
  getRecentChatOnlyLeads: (...args) => mockGetRecentChatOnlyLeads(...args),
}));

vi.mock("../repositories/contactRepository.js", () => ({
  updateRequest: (...args) => mockUpdateRequest(...args),
  deleteRequest: (...args) => mockDeleteRequest(...args),
}));

vi.mock("../repositories/questionRepository.js", () => ({
  createTopic: (...args) => mockCreateTopic(...args),
}));

vi.mock("../services/chatService.js", () => ({
  callXaiApi: (...args) => mockCallXaiApi(...args),
}));

vi.mock("../config/firebase.js", () => ({
  default: {
    auth: () => ({
      getUserByEmail: (...args) => mockGetUserByEmail(...args),
      setCustomUserClaims: (...args) => mockSetCustomUserClaims(...args),
    }),
  },
}));

vi.mock("./gdprService.js", () => ({
  deleteUserAccount: (...args) => mockDeleteUserAccount(...args),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...args) => mockResendSend(...args) };
  },
}));

vi.mock("csv-stringify/sync", () => ({
  stringify: (rows) => {
    if (!rows.length) return "";
    const keys = Object.keys(rows[0]);
    const header = keys.join(",");
    const body = rows.map((r) => keys.map((k) => r[k] ?? "").join(","));
    return [header, ...body].join("\n");
  },
}));

const {
  getUsers,
  getRequestsByUserId,
  getChatOnlyLeads,
  getChatLeadDetail,
  updateRequest,
  deleteRequest,
  analyzeTopics,
  getTopics,
  exportToCSV,
  manageAdmins,
  runRetentionSweep,
  sendDailyDigest,
} = await import("./adminService.js");

describe("adminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUsers", () => {
    it("returns users from repository", async () => {
      const users = [{ userId: "uid-1", name: "Alice" }];
      mockGetUsersWithRequests.mockResolvedValue(users);

      const result = await getUsers();

      expect(result).toEqual(users);
      expect(mockGetUsersWithRequests).toHaveBeenCalled();
    });
  });

  describe("getRequestsByUserId", () => {
    it("returns requests with full question arrays", async () => {
      const requests = [
        {
          id: 1,
          questionPreview: "Hello?",
          questions: [{ id: 10, question: "Hello?" }],
        },
      ];
      mockGetRequestsWithQuestionsByUserId.mockResolvedValue(requests);

      const result = await getRequestsByUserId("uid-1");

      expect(result).toEqual(requests);
      expect(mockGetRequestsWithQuestionsByUserId).toHaveBeenCalledWith(
        "uid-1",
      );
    });
  });

  describe("getChatOnlyLeads", () => {
    it("returns chat-only users", async () => {
      const leads = [{ userId: "uid-2", totalMessages: 5 }];
      mockGetChatOnlyUsers.mockResolvedValue(leads);

      const result = await getChatOnlyLeads();

      expect(result).toEqual(leads);
      expect(mockGetChatOnlyUsers).toHaveBeenCalled();
    });
  });

  describe("getChatLeadDetail", () => {
    it("returns chat messages for user", async () => {
      const messages = [{ id: 1, question: "Hi", answer: "Hello" }];
      mockGetChatMessagesByUserId.mockResolvedValue(messages);

      const result = await getChatLeadDetail("uid-1");

      expect(result).toEqual(messages);
      expect(mockGetChatMessagesByUserId).toHaveBeenCalledWith("uid-1");
    });
  });

  describe("updateRequest", () => {
    it("returns updated request on success", async () => {
      const updated = { id: 1, status: "contacted" };
      mockUpdateRequest.mockResolvedValue(updated);

      const result = await updateRequest(1, { status: "contacted" });

      expect(result).toEqual(updated);
      expect(mockUpdateRequest).toHaveBeenCalledWith(1, {
        status: "contacted",
      });
    });

    it("throws 404 when request not found", async () => {
      mockUpdateRequest.mockResolvedValue(null);

      const error = await updateRequest(999, { status: "resolved" }).catch(
        (e) => e,
      );

      expect(error.message).toBe("Contact request not found");
      expect(error.statusCode).toBe(404);
    });
  });

  describe("deleteRequest", () => {
    it("returns success on deletion", async () => {
      mockDeleteRequest.mockResolvedValue(true);

      const result = await deleteRequest(1);

      expect(result).toEqual({ success: true });
      expect(mockDeleteRequest).toHaveBeenCalledWith(1);
    });

    it("throws 404 when request not found", async () => {
      mockDeleteRequest.mockResolvedValue(false);

      const error = await deleteRequest(999).catch((e) => e);

      expect(error.message).toBe("Contact request not found");
      expect(error.statusCode).toBe(404);
    });
  });

  describe("analyzeTopics", () => {
    it("processes questions in batches and returns counts", async () => {
      const questions = [
        { id: 1, question: "What is battery?" },
        { id: 2, question: "EU regulations?" },
        { id: 3, question: "Pricing info?" },
      ];
      mockGetUncategorizedQuestions.mockResolvedValue(questions);
      mockCallXaiApi.mockResolvedValue("battery, energy");
      mockCreateTopic.mockResolvedValue({});

      const result = await analyzeTopics();

      expect(result.processed).toBe(3);
      expect(result.skipped).toBe(0);
      expect(mockCallXaiApi).toHaveBeenCalledTimes(3);
      expect(mockCreateTopic).toHaveBeenCalledTimes(6);
    });

    it("skips failed questions without stopping batch", async () => {
      const questions = [
        { id: 1, question: "Good question" },
        { id: 2, question: "Bad question" },
      ];
      mockGetUncategorizedQuestions.mockResolvedValue(questions);
      mockCallXaiApi
        .mockResolvedValueOnce("topic1")
        .mockRejectedValueOnce(new Error("API error"));
      mockCreateTopic.mockResolvedValue({});

      const result = await analyzeTopics();

      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it("returns zero counts when no uncategorized questions", async () => {
      mockGetUncategorizedQuestions.mockResolvedValue([]);

      const result = await analyzeTopics();

      expect(result).toEqual({ processed: 0, skipped: 0 });
    });
  });

  describe("getTopics", () => {
    it("returns topic aggregates", async () => {
      const topics = [{ topic: "battery", count: 10 }];
      mockGetTopicAggregates.mockResolvedValue(topics);

      const result = await getTopics();

      expect(result).toEqual(topics);
    });
  });

  describe("exportToCSV", () => {
    it("returns CSV string from export data", async () => {
      const rows = [{ firebase_uid: "u1", name: "Alice", question: "Hello?" }];
      mockGetAllDataForExport.mockResolvedValue(rows);

      const result = await exportToCSV();

      expect(result).toContain("firebase_uid");
      expect(result).toContain("Alice");
    });

    it("returns empty string when no data", async () => {
      mockGetAllDataForExport.mockResolvedValue([]);

      const result = await exportToCSV();

      expect(result).toBe("");
    });
  });

  describe("manageAdmins", () => {
    it("adds admin claim while preserving existing claims", async () => {
      mockGetUserByEmail.mockResolvedValue({
        uid: "uid-1",
        customClaims: { superAdmin: true, role: "editor" },
      });
      mockSetCustomUserClaims.mockResolvedValue();

      const result = await manageAdmins("add", "test@example.com");

      expect(result).toEqual({
        success: true,
        email: "test@example.com",
        action: "add",
      });
      expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid-1", {
        superAdmin: true,
        role: "editor",
        admin: true,
      });
    });

    it("removes admin claim while preserving other claims", async () => {
      mockGetUserByEmail.mockResolvedValue({
        uid: "uid-1",
        customClaims: { superAdmin: true, admin: true },
      });
      mockSetCustomUserClaims.mockResolvedValue();

      const result = await manageAdmins("remove", "test@example.com");

      expect(result).toEqual({
        success: true,
        email: "test@example.com",
        action: "remove",
      });
      expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid-1", {
        superAdmin: true,
        admin: false,
      });
    });

    it("handles user with no existing claims", async () => {
      mockGetUserByEmail.mockResolvedValue({
        uid: "uid-2",
        customClaims: null,
      });
      mockSetCustomUserClaims.mockResolvedValue();

      await manageAdmins("add", "new@example.com");

      expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid-2", {
        admin: true,
      });
    });

    it("throws 404 when Firebase user not found", async () => {
      const fbError = new Error("User not found");
      fbError.code = "auth/user-not-found";
      mockGetUserByEmail.mockRejectedValue(fbError);

      const error = await manageAdmins("add", "none@example.com").catch(
        (e) => e,
      );

      expect(error.message).toBe("User not found");
      expect(error.statusCode).toBe(404);
    });
  });

  describe("runRetentionSweep", () => {
    it("deletes inactive users and returns counts", async () => {
      mockGetInactiveUsers.mockResolvedValue([
        { firebase_uid: "uid-1" },
        { firebase_uid: "uid-2" },
      ]);
      mockDeleteUserAccount.mockResolvedValue({ success: true });

      const result = await runRetentionSweep();

      expect(result).toEqual({ processed: 2, anonymized: 2 });
      expect(mockGetInactiveUsers).toHaveBeenCalled();
      expect(mockDeleteUserAccount).toHaveBeenCalledTimes(2);
      expect(mockDeleteUserAccount).toHaveBeenCalledWith("uid-1");
      expect(mockDeleteUserAccount).toHaveBeenCalledWith("uid-2");
    });

    it("counts partial failures correctly", async () => {
      mockGetInactiveUsers.mockResolvedValue([
        { firebase_uid: "uid-1" },
        { firebase_uid: "uid-2" },
      ]);
      mockDeleteUserAccount
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error("delete failed"));

      const result = await runRetentionSweep();

      expect(result.processed).toBe(2);
      expect(result.anonymized).toBe(1);
    });

    it("returns zero counts when no inactive users", async () => {
      mockGetInactiveUsers.mockResolvedValue([]);

      const result = await runRetentionSweep();

      expect(result).toEqual({ processed: 0, anonymized: 0 });
    });
  });

  describe("sendDailyDigest", () => {
    it("sends digest email with inquiry and lead counts", async () => {
      const inquiries = [
        {
          id: 1,
          name: "Alice",
          email: "a@b.com",
          company: "Acme",
          status: "new",
        },
      ];
      const chatLeads = [
        { userId: "uid-1", name: "Bob", email: "b@c.com", totalMessages: 5 },
      ];
      mockGetRecentInquiries.mockResolvedValue(inquiries);
      mockGetRecentChatOnlyLeads.mockResolvedValue(chatLeads);
      mockResendSend.mockResolvedValue({ error: null });

      const result = await sendDailyDigest();

      expect(result).toEqual({ sent: true, inquiries: 1, chatLeads: 1 });
      expect(mockGetRecentInquiries).toHaveBeenCalled();
      expect(mockGetRecentChatOnlyLeads).toHaveBeenCalled();
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Daily Inquiry Digest"),
        }),
      );
    });

    it("throws when Resend returns an error", async () => {
      mockGetRecentInquiries.mockResolvedValue([]);
      mockGetRecentChatOnlyLeads.mockResolvedValue([]);
      mockResendSend.mockResolvedValue({
        error: { message: "API key invalid" },
      });

      await expect(sendDailyDigest()).rejects.toThrow("API key invalid");
    });
  });
});
