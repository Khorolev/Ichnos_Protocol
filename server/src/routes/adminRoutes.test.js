import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
const mockAnalyzeTopics = vi.fn();
const mockGetTopics = vi.fn();
const mockExportToCSV = vi.fn();
const mockManageAdmins = vi.fn();
const mockRunRetentionSweep = vi.fn();
const mockSendDailyDigest = vi.fn();

vi.mock("../services/adminService.js", () => ({
  getUsers: (...args) => mockGetUsers(...args),
  getRequestsByUserId: (...args) => mockGetRequestsByUserId(...args),
  getChatOnlyLeads: (...args) => mockGetChatOnlyLeads(...args),
  getChatLeadDetail: (...args) => mockGetChatLeadDetail(...args),
  updateRequest: (...args) => mockUpdateRequest(...args),
  deleteRequest: (...args) => mockDeleteRequest(...args),
  analyzeTopics: (...args) => mockAnalyzeTopics(...args),
  getTopics: (...args) => mockGetTopics(...args),
  exportToCSV: (...args) => mockExportToCSV(...args),
  manageAdmins: (...args) => mockManageAdmins(...args),
  runRetentionSweep: (...args) => mockRunRetentionSweep(...args),
  sendDailyDigest: (...args) => mockSendDailyDigest(...args),
}));

globalThis.fetch = vi.fn();

const { default: app } = await import("../app.js");

const adminToken = { uid: "admin-uid", admin: true };
const superAdminToken = { uid: "super-uid", admin: true, superAdmin: true };
const userToken = { uid: "user-uid" };

function authHeader() {
  return { Authorization: "Bearer valid-token" };
}

describe("admin routes", () => {
  let originalCronSecret;

  beforeEach(() => {
    originalCronSecret = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    mockVerifyIdToken.mockReset();
    mockQuery.mockReset();
    mockGetUsers.mockReset();
    mockGetRequestsByUserId.mockReset();
    mockGetChatOnlyLeads.mockReset();
    mockGetChatLeadDetail.mockReset();
    mockUpdateRequest.mockReset();
    mockDeleteRequest.mockReset();
    mockAnalyzeTopics.mockReset();
    mockGetTopics.mockReset();
    mockExportToCSV.mockReset();
    mockManageAdmins.mockReset();
    mockRunRetentionSweep.mockReset();
    mockSendDailyDigest.mockReset();
  });

  afterEach(() => {
    if (originalCronSecret !== undefined) {
      process.env.CRON_SECRET = originalCronSecret;
    } else {
      delete process.env.CRON_SECRET;
    }
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

  describe("POST /api/admin/analyze-topics", () => {
    it("returns 200 for admin", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockAnalyzeTopics.mockResolvedValue({ processed: 5, skipped: 1 });

      const res = await request(app)
        .post("/api/admin/analyze-topics")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Topics analyzed");
      expect(res.body.data.processed).toBe(5);
    });

    it("returns 403 for non-admin", async () => {
      mockVerifyIdToken.mockResolvedValue(userToken);

      const res = await request(app)
        .post("/api/admin/analyze-topics")
        .set(authHeader());

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/admin/topics", () => {
    it("returns 200 with topic list", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockGetTopics.mockResolvedValue([{ topic: "battery", count: 10 }]);

      const res = await request(app)
        .get("/api/admin/topics")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Topics retrieved");
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/admin/export", () => {
    it("returns 200 with CSV content", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockExportToCSV.mockResolvedValue("name,email\nAlice,a@b.com");

      const res = await request(app)
        .get("/api/admin/export")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("Alice");
    });

    it("returns 403 for non-admin", async () => {
      mockVerifyIdToken.mockResolvedValue(userToken);

      const res = await request(app)
        .get("/api/admin/export")
        .set(authHeader());

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/admin/manage-admins", () => {
    it("returns 200 for super-admin with valid body", async () => {
      mockVerifyIdToken.mockResolvedValue(superAdminToken);
      mockManageAdmins.mockResolvedValue({
        success: true,
        email: "x@y.com",
        action: "add",
      });

      const res = await request(app)
        .post("/api/admin/manage-admins")
        .set(authHeader())
        .send({ action: "add", email: "x@y.com" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Admin updated");
    });

    it("returns 403 for regular admin (non-super-admin)", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);

      const res = await request(app)
        .post("/api/admin/manage-admins")
        .set(authHeader())
        .send({ action: "add", email: "x@y.com" });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Super-admin");
    });

    it("returns 422 with invalid body", async () => {
      mockVerifyIdToken.mockResolvedValue(superAdminToken);

      const res = await request(app)
        .post("/api/admin/manage-admins")
        .set(authHeader())
        .send({ action: "invalid" });

      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/admin/retention-sweep", () => {
    it("returns 200 for admin", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockRunRetentionSweep.mockResolvedValue({ processed: 2, anonymized: 2 });

      const res = await request(app)
        .post("/api/admin/retention-sweep")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Retention sweep complete");
      expect(res.body.data.processed).toBe(2);
    });

    it("returns 200 with valid cron secret Bearer token", async () => {
      process.env.CRON_SECRET = "test-cron-secret";
      mockRunRetentionSweep.mockResolvedValue({ processed: 1, anonymized: 1 });

      const res = await request(app)
        .post("/api/admin/retention-sweep")
        .set("Authorization", "Bearer test-cron-secret");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Retention sweep complete");

    });

    it("returns 401 without auth token and without cron secret", async () => {
      const res = await request(app).post("/api/admin/retention-sweep");

      expect(res.status).toBe(401);
    });

    it("returns 401 with invalid cron secret and no Firebase token", async () => {
      process.env.CRON_SECRET = "test-cron-secret";
      mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      const res = await request(app)
        .post("/api/admin/retention-sweep")
        .set("Authorization", "Bearer wrong-secret");

      expect(res.status).toBe(401);

    });

    it("returns 403 for non-admin user", async () => {
      mockVerifyIdToken.mockResolvedValue(userToken);

      const res = await request(app)
        .post("/api/admin/retention-sweep")
        .set(authHeader());

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/admin/retention-sweep", () => {
    it("returns 200 with valid cron secret Bearer token", async () => {
      process.env.CRON_SECRET = "test-cron-secret";
      mockRunRetentionSweep.mockResolvedValue({ processed: 1, anonymized: 1 });

      const res = await request(app)
        .get("/api/admin/retention-sweep")
        .set("Authorization", "Bearer test-cron-secret");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Retention sweep complete");

    });

    it("returns 401 with invalid secret and no Firebase token", async () => {
      process.env.CRON_SECRET = "test-cron-secret";
      mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      const res = await request(app)
        .get("/api/admin/retention-sweep")
        .set("Authorization", "Bearer wrong-secret");

      expect(res.status).toBe(401);

    });

    it("returns 200 with valid Firebase admin token", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockRunRetentionSweep.mockResolvedValue({ processed: 3, anonymized: 3 });

      const res = await request(app)
        .get("/api/admin/retention-sweep")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Retention sweep complete");
    });

    it("returns 403 for non-admin user", async () => {
      mockVerifyIdToken.mockResolvedValue(userToken);

      const res = await request(app)
        .get("/api/admin/retention-sweep")
        .set(authHeader());

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/admin/notifications/digest", () => {
    it("returns 200 for admin", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockSendDailyDigest.mockResolvedValue({ sent: true, inquiries: 3, chatLeads: 1 });

      const res = await request(app)
        .post("/api/admin/notifications/digest")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Digest sent");
      expect(res.body.data.sent).toBe(true);
    });

    it("returns 200 with valid cron secret Bearer token", async () => {
      process.env.CRON_SECRET = "test-cron-secret";
      mockSendDailyDigest.mockResolvedValue({ sent: true, inquiries: 1, chatLeads: 0 });

      const res = await request(app)
        .post("/api/admin/notifications/digest")
        .set("Authorization", "Bearer test-cron-secret");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Digest sent");

    });

    it("returns 401 without auth token and without cron secret", async () => {
      const res = await request(app).post("/api/admin/notifications/digest");

      expect(res.status).toBe(401);
    });

    it("returns 401 with invalid cron secret and no Firebase token", async () => {
      process.env.CRON_SECRET = "test-cron-secret";
      mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      const res = await request(app)
        .post("/api/admin/notifications/digest")
        .set("Authorization", "Bearer wrong-secret");

      expect(res.status).toBe(401);

    });

    it("returns 403 for non-admin user", async () => {
      mockVerifyIdToken.mockResolvedValue(userToken);

      const res = await request(app)
        .post("/api/admin/notifications/digest")
        .set(authHeader());

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/admin/notifications/digest", () => {
    it("returns 200 with valid cron secret Bearer token", async () => {
      process.env.CRON_SECRET = "test-cron-secret";
      mockSendDailyDigest.mockResolvedValue({ sent: true, inquiries: 2, chatLeads: 1 });

      const res = await request(app)
        .get("/api/admin/notifications/digest")
        .set("Authorization", "Bearer test-cron-secret");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Digest sent");

    });

    it("returns 401 with invalid secret and no Firebase token", async () => {
      process.env.CRON_SECRET = "test-cron-secret";
      mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      const res = await request(app)
        .get("/api/admin/notifications/digest")
        .set("Authorization", "Bearer wrong-secret");

      expect(res.status).toBe(401);

    });

    it("returns 200 with valid Firebase admin token", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockSendDailyDigest.mockResolvedValue({ sent: true, inquiries: 0, chatLeads: 0 });

      const res = await request(app)
        .get("/api/admin/notifications/digest")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Digest sent");
    });

    it("returns 403 for non-admin user", async () => {
      mockVerifyIdToken.mockResolvedValue(userToken);

      const res = await request(app)
        .get("/api/admin/notifications/digest")
        .set(authHeader());

      expect(res.status).toBe(403);
    });
  });
});
