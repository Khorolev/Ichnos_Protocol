import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mockVerifyIdToken = vi.fn();
const mockGetFirebaseUser = vi.fn();
const mockSetCustomUserClaims = vi.fn();
const mockQuery = vi.fn();

vi.mock("../config/firebase.js", () => ({
  default: {
    auth: () => ({
      verifyIdToken: mockVerifyIdToken,
      getUser: mockGetFirebaseUser,
      setCustomUserClaims: mockSetCustomUserClaims,
    }),
  },
}));

vi.mock("../config/database.js", () => ({
  default: { query: (...args) => mockQuery(...args) },
}));

const { default: app } = await import("../app.js");

const validProfile = {
  name: "John",
  surname: "Doe",
  email: "john@example.com",
};

const decodedToken = { uid: "uid-1", email: "john@example.com" };

function authHeader() {
  return { Authorization: "Bearer valid-token" };
}

describe("auth routes", () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
    mockGetFirebaseUser.mockReset();
    mockSetCustomUserClaims.mockReset();
    mockQuery.mockReset();
  });

  describe("POST /api/auth/sync-profile", () => {
    it("returns 200 with synced profile data", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery
        .mockResolvedValueOnce({ rows: [{ firebase_uid: "uid-1" }] })
        .mockResolvedValueOnce({
          rows: [{ user_id: "uid-1", ...validProfile }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });
      mockGetFirebaseUser.mockResolvedValue({
        customClaims: { admin: false },
      });

      const res = await request(app)
        .post("/api/auth/sync-profile")
        .set(authHeader())
        .send(validProfile);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.name).toBe("John");
      expect(res.body.data.isAdmin).toBe(false);
      expect(res.body.message).toBe("Profile synced");
    });

    it("creates user when not found, then syncs", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ firebase_uid: "uid-1" }] })
        .mockResolvedValueOnce({
          rows: [{ user_id: "uid-1", ...validProfile }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });
      mockGetFirebaseUser.mockResolvedValue({ customClaims: undefined });

      const res = await request(app)
        .post("/api/auth/sync-profile")
        .set(authHeader())
        .send(validProfile);

      expect(res.status).toBe(200);
      expect(res.body.data.isAdmin).toBe(false);
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/auth/sync-profile")
        .send(validProfile);

      expect(res.status).toBe(401);
    });

    it("returns 400 on validation failure", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .post("/api/auth/sync-profile")
        .set(authHeader())
        .send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });
  });

  describe("POST /api/auth/verify-token", () => {
    it("returns 200 with decoded token", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .post("/api/auth/verify-token")
        .send({ idToken: "valid-token" });

      expect(res.status).toBe(200);
      expect(res.body.data.decoded.uid).toBe("uid-1");
      expect(res.body.message).toBe("Token verified");
    });

    it("returns 400 when idToken is missing", async () => {
      const res = await request(app)
        .post("/api/auth/verify-token")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("idToken is required");
    });

    it("returns 500 on invalid token", async () => {
      mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      const res = await request(app)
        .post("/api/auth/verify-token")
        .send({ idToken: "bad-token" });

      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 200 with user data and admin flag", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({
        rows: [{ firebase_uid: "uid-1", name: "John", surname: "Doe" }],
      });
      mockGetFirebaseUser.mockResolvedValue({
        customClaims: { admin: true },
      });

      const res = await request(app)
        .get("/api/auth/me")
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe("John");
      expect(res.body.data.isAdmin).toBe(true);
      expect(res.body.message).toBe("User retrieved");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
    });

    it("returns 404 when user not found in DB", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get("/api/auth/me")
        .set(authHeader());

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/auth/profile", () => {
    it("returns 200 with updated profile", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              firebase_uid: "uid-1",
              name: "John",
              surname: "Doe",
              email: "john@example.com",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ user_id: "uid-1", name: "Jane", surname: "Doe" }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .put("/api/auth/profile")
        .set(authHeader())
        .send({ name: "Jane" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Profile updated");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .send({ name: "Jane" });

      expect(res.status).toBe(401);
    });

    it("returns 400 on invalid profile data", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .put("/api/auth/profile")
        .set(authHeader())
        .send({ email: "not-an-email" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 404 when user not found", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put("/api/auth/profile")
        .set(authHeader())
        .send({ name: "Jane" });

      expect(res.status).toBe(404);
    });
  });
});
