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
    it("returns 200 with synced profile data (unauthenticated)", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ firebase_uid: "uid-1" }] })
        .mockResolvedValueOnce({
          rows: [{ user_id: "uid-1", ...validProfile }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });
      mockGetFirebaseUser.mockResolvedValue({
        email: "john@example.com",
        customClaims: { admin: false },
      });

      const res = await request(app)
        .post("/api/auth/sync-profile")
        .send({ firebaseUid: "uid-1", ...validProfile });

      expect(res.status).toBe(200);
      expect(res.body.data.profile.name).toBe("John");
      expect(res.body.data.isAdmin).toBe(false);
      expect(res.body.data.profileState.isProfileComplete).toBe(true);
      expect(res.body.data.profileState.missingRequiredFields).toEqual([]);
      expect(res.body.message).toBe("Profile synced");
    });

    it("creates user when not found, then syncs", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ firebase_uid: "uid-1" }] })
        .mockResolvedValueOnce({
          rows: [{ user_id: "uid-1", ...validProfile }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });
      mockGetFirebaseUser.mockResolvedValue({
        email: "john@example.com",
        customClaims: undefined,
      });

      const res = await request(app)
        .post("/api/auth/sync-profile")
        .send({ firebaseUid: "uid-1", ...validProfile });

      expect(res.status).toBe(200);
      expect(res.body.data.isAdmin).toBe(false);
    });

    it("returns 400 when firebaseUid is missing", async () => {
      const res = await request(app)
        .post("/api/auth/sync-profile")
        .send(validProfile);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("returns 200 with profileState for partial profile", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ firebase_uid: "uid-1" }] })
        .mockResolvedValueOnce({
          rows: [{ user_id: "uid-1", email: "test@firebase.com" }],
        })
        .mockResolvedValueOnce({ rowCount: 1 });
      mockGetFirebaseUser.mockResolvedValue({
        email: "test@firebase.com",
        customClaims: {},
      });

      const res = await request(app)
        .post("/api/auth/sync-profile")
        .send({ firebaseUid: "uid-1" });

      expect(res.status).toBe(200);
      expect(res.body.data.profileState.isProfileComplete).toBe(false);
      expect(res.body.data.profileState.missingRequiredFields).toContain(
        "name",
      );
      expect(res.body.data.profileState.missingRequiredFields).toContain(
        "surname",
      );
    });

    it("returns 400 on validation failure", async () => {
      const res = await request(app)
        .post("/api/auth/sync-profile")
        .send({ firebaseUid: "uid-1", name: "" });

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
    it("returns 200 with user data, admin flag, and profileState", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            firebase_uid: "uid-1",
            name: "John",
            surname: "Doe",
            email: "john@example.com",
          },
        ],
      });
      mockGetFirebaseUser.mockResolvedValue({
        customClaims: { admin: true },
      });

      const res = await request(app).get("/api/auth/me").set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe("John");
      expect(res.body.data.isAdmin).toBe(true);
      expect(res.body.data.profileState.isProfileComplete).toBe(true);
      expect(res.body.data.profileState.missingRequiredFields).toEqual([]);
      expect(res.body.message).toBe("User retrieved");
    });

    it("returns profileState with missing fields for incomplete profile", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            firebase_uid: "uid-1",
            name: null,
            surname: null,
            email: null,
          },
        ],
      });
      mockGetFirebaseUser.mockResolvedValue({
        customClaims: {},
      });

      const res = await request(app).get("/api/auth/me").set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.profileState.isProfileComplete).toBe(false);
      expect(res.body.data.profileState.missingRequiredFields).toEqual([
        "name",
        "surname",
        "email",
      ]);
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

    it("uses Firebase email when DB email is null", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            firebase_uid: "uid-1",
            name: "John",
            surname: "Doe",
            email: null,
          },
        ],
      });
      mockGetFirebaseUser.mockResolvedValue({
        email: "canonical@firebase.com",
        customClaims: {},
      });

      const res = await request(app).get("/api/auth/me").set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("canonical@firebase.com");
      expect(res.body.data.profileState.isProfileComplete).toBe(true);
      expect(res.body.data.profileState.missingRequiredFields).toEqual([]);
    });

    it("uses Firebase email over outdated DB email", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            firebase_uid: "uid-1",
            name: "John",
            surname: "Doe",
            email: "old@example.com",
          },
        ],
      });
      mockGetFirebaseUser.mockResolvedValue({
        email: "new@firebase.com",
        customClaims: { admin: true },
      });

      const res = await request(app).get("/api/auth/me").set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("new@firebase.com");
      expect(res.body.data.isAdmin).toBe(true);
      expect(res.body.data.profileState.isProfileComplete).toBe(true);
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

  describe("POST /api/auth/admin/claim", () => {
    const adminToken = { uid: "admin-1", admin: true };

    it("returns 200 and updates admin claim", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockSetCustomUserClaims.mockResolvedValue();

      const res = await request(app)
        .post("/api/auth/admin/claim")
        .set(authHeader())
        .send({ firebaseUid: "uid-2", isAdmin: true });

      expect(res.status).toBe(200);
      expect(res.body.data.firebaseUid).toBe("uid-2");
      expect(res.body.data.admin).toBe(true);
      expect(res.body.message).toBe("Admin claim updated");
    });

    it("returns 200 when revoking admin claim", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);
      mockSetCustomUserClaims.mockResolvedValue();

      const res = await request(app)
        .post("/api/auth/admin/claim")
        .set(authHeader())
        .send({ firebaseUid: "uid-2", isAdmin: false });

      expect(res.status).toBe(200);
      expect(res.body.data.admin).toBe(false);
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/auth/admin/claim")
        .send({ firebaseUid: "uid-2", isAdmin: true });

      expect(res.status).toBe(401);
    });

    it("returns 403 when user is not admin", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);

      const res = await request(app)
        .post("/api/auth/admin/claim")
        .set(authHeader())
        .send({ firebaseUid: "uid-2", isAdmin: true });

      expect(res.status).toBe(403);
    });

    it("returns 400 on invalid payload", async () => {
      mockVerifyIdToken.mockResolvedValue(adminToken);

      const res = await request(app)
        .post("/api/auth/admin/claim")
        .set(authHeader())
        .send({ firebaseUid: "uid-2" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed");
    });
  });
});
