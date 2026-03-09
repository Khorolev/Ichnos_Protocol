import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUsersWithRequests = vi.fn();
const mockGetRequestsWithQuestionsByUserId = vi.fn();
const mockGetChatOnlyUsers = vi.fn();
const mockGetChatMessagesByUserId = vi.fn();
const mockUpdateRequest = vi.fn();
const mockDeleteRequest = vi.fn();

vi.mock("../repositories/adminRepository.js", () => ({
  getUsersWithRequests: (...args) => mockGetUsersWithRequests(...args),
  getRequestsWithQuestionsByUserId: (...args) =>
    mockGetRequestsWithQuestionsByUserId(...args),
  getChatOnlyUsers: (...args) => mockGetChatOnlyUsers(...args),
  getChatMessagesByUserId: (...args) => mockGetChatMessagesByUserId(...args),
}));

vi.mock("../repositories/contactRepository.js", () => ({
  updateRequest: (...args) => mockUpdateRequest(...args),
  deleteRequest: (...args) => mockDeleteRequest(...args),
}));

const {
  getUsers,
  getRequestsByUserId,
  getChatOnlyLeads,
  getChatLeadDetail,
  updateRequest,
  deleteRequest,
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
      const requests = [{ id: 1, questionPreview: "Hello?", questions: [{ id: 10, question: "Hello?" }] }];
      mockGetRequestsWithQuestionsByUserId.mockResolvedValue(requests);

      const result = await getRequestsByUserId("uid-1");

      expect(result).toEqual(requests);
      expect(mockGetRequestsWithQuestionsByUserId).toHaveBeenCalledWith("uid-1");
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
      expect(mockUpdateRequest).toHaveBeenCalledWith(1, { status: "contacted" });
    });

    it("throws 404 when request not found", async () => {
      mockUpdateRequest.mockResolvedValue(null);

      const error = await updateRequest(999, { status: "resolved" }).catch((e) => e);

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
});
