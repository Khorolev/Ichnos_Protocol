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

const mockGetUsers = vi.fn();
const mockGetRequestsByUserId = vi.fn();
const mockGetChatOnlyLeads = vi.fn();
const mockGetChatLeadDetail = vi.fn();
const mockUpdateRequest = vi.fn();
const mockDeleteRequest = vi.fn();

vi.mock("../services/adminService.js", () => ({
  getUsers: (...args) => mockGetUsers(...args),
  getRequestsByUserId: (...args) => mockGetRequestsByUserId(...args),
  getChatOnlyLeads: (...args) => mockGetChatOnlyLeads(...args),
  getChatLeadDetail: (...args) => mockGetChatLeadDetail(...args),
  updateRequest: (...args) => mockUpdateRequest(...args),
  deleteRequest: (...args) => mockDeleteRequest(...args),
}));

globalThis.fetch = vi.fn();

const { default: app } = await import("../app.js");

const adminToken = { uid: "admin-uid", admin: true };
const userToken = { uid: "user-uid" };

function authHeader() {
  return { Authorization: "Bearer valid-token" };
}

describe("admin routes", () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
    mockQuery.mockReset();
    mockGetUsers.mockReset();
    mockGetRequestsByUserId.mockReset();
    mockGetChatOnlyLeads.mockReset();
    mockGetChatLeadDetail.mockReset();
    mockUpdateRequest.mockReset();
    mockDeleteRequest.mockReset();
  });

  describe("GET /api/admin/users", () => {
    it("returns 200 for admin", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockGetUsers.mockResolvedValue([{ userId: "uid-1" }]);

      const res = await request(app)
        .get("/api/admin/users")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Users retrieved");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app).get("/api/admin/users");

      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin user", async () => {
      mockVerifyIdToken.mockResolvedValue(userToken);

      const res = await request(app)
        .get("/api/admin/users")
        .set(authHeader());

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/admin/requests/:userId", () => {
    it("returns 200 with requests", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockGetRequestsByUserId.mockResolvedValue([{ id: 1 }]);

      const res = await request(app)
        .get("/api/admin/requests/uid-1")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Requests retrieved");
    });
  });

  describe("GET /api/admin/chat-leads", () => {
    it("returns 200 with chat leads", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockGetChatOnlyLeads.mockResolvedValue([{ userId: "uid-2" }]);

      const res = await request(app)
        .get("/api/admin/chat-leads")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Chat leads retrieved");
    });
  });

  describe("GET /api/admin/chat-leads/:userId", () => {
    it("returns 200 with chat messages", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockGetChatLeadDetail.mockResolvedValue([{ id: 1, question: "Hi" }]);

      const res = await request(app)
        .get("/api/admin/chat-leads/uid-2")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Chat messages retrieved");
    });
  });

  describe("PUT /api/admin/request/:id", () => {
    it("returns 200 with valid body", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockUpdateRequest.mockResolvedValue({ id: 1, status: "contacted" });

      const res = await request(app)
        .put("/api/admin/request/1")
        .set(authHeader())
        .send({ status: "contacted" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Request updated");
    });

    it("returns 400 for non-numeric id", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);

      const res = await request(app)
        .put("/api/admin/request/abc")
        .set(authHeader())
        .send({ status: "contacted" });

      expect(res.status).toBe(400);
    });

    it("returns 422 with empty body", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);

      const res = await request(app)
        .put("/api/admin/request/1")
        .set(authHeader())
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.message).toBe("Validation failed");
    });
  });

  describe("DELETE /api/admin/request/:id", () => {
    it("returns 200 on successful deletion", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockDeleteRequest.mockResolvedValue({ success: true });

      const res = await request(app)
        .delete("/api/admin/request/1")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Request deleted");
    });

    it("returns 400 for non-numeric id", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);

      const res = await request(app)
        .delete("/api/admin/request/abc")
        .set(authHeader());

      expect(res.status).toBe(400);
    });
  });
});
