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
    it("returns 200 with synced profile data for authenticated request", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
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
        .set(authHeader())
        .send(validProfile);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.name).toBe("John");
      expect(res.body.data.isAdmin).toBe(false);
      expect(res.body.data.profileState.isProfileComplete).toBe(true);
      expect(res.body.data.profileState.missingRequiredFields).toEqual([]);
      expect(res.body.message).toBe("Profile synced");
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/auth/sync-profile")
        .send(validProfile);

      expect(res.status).toBe(401);
      expect(mockVerifyIdToken).not.toHaveBeenCalled();
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
      mockGetFirebaseUser.mockResolvedValue({
        email: "john@example.com",
        customClaims: undefined,
      });

      const res = await request(app)
        .post("/api/auth/sync-profile")
        .set(authHeader())
        .send(validProfile);

      expect(res.status).toBe(200);
      expect(res.body.data.isAdmin).toBe(false);
    });

    it("allows body without firebaseUid (no longer required)", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
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
        .set(authHeader())
        .send(validProfile);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.name).toBe("John");
    });

    it("ignores body firebaseUid and uses token UID as identity", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
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
        .set(authHeader())
        .send({ firebaseUid: "attacker-uid", ...validProfile });

      expect(res.status).toBe(200);
      expect(mockGetFirebaseUser).toHaveBeenCalledWith("uid-1");
      expect(mockGetFirebaseUser).not.toHaveBeenCalledWith("attacker-uid");
    });

    it("returns 200 with profileState for partial profile", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
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
        .set(authHeader())
        .send({});

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

    // T4 normalization: the service now maps repository rows to the
    // canonical camelCase shape via mapUserRow, so `firebaseUid` is
    // exposed and the legacy `firebase_uid` snake_case key is gone.
    it("response data.user exposes canonical firebaseUid (T4 normalized)", async () => {
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
        email: "john@example.com",
        customClaims: {},
      });

      const res = await request(app).get("/api/auth/me").set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.user.firebaseUid).toBe("uid-1");
      expect(res.body.data.user).not.toHaveProperty("firebase_uid");
      expect(res.body.data.user.name).toBe("John");
      expect(res.body.data.user.email).toBe("john@example.com");
    });

    it("response data.user includes canonical profile fields with LEFT JOIN nulls", async () => {
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            firebase_uid: "uid-1",
            deleted_at: null,
            created_at: "2025-01-01T00:00:00.000Z",
            updated_at: "2025-01-01T00:00:00.000Z",
            name: "John",
            surname: "Doe",
            email: "john@example.com",
            phone: null,
            company: null,
            linkedin: null,
          },
        ],
      });
      mockGetFirebaseUser.mockResolvedValue({
        email: "john@example.com",
        customClaims: {},
      });

      const res = await request(app).get("/api/auth/me").set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe("John");
      expect(res.body.data.user.surname).toBe("Doe");
      expect(res.body.data.user.email).toBe("john@example.com");
      expect(res.body.data.user).toHaveProperty("phone");
      expect(res.body.data.user).toHaveProperty("company");
      expect(res.body.data.user).toHaveProperty("linkedin");
      expect(res.body.data.user).toHaveProperty("firebaseUid");
      expect(res.body.data.user).not.toHaveProperty("firebase_uid");
    });

    // T4 normalization: authService.getUser now maps repository rows to
    // the canonical camelCase shape via mapUserRow. Repository-only
    // fields (deleted_at, created_at, updated_at) and the snake_case
    // firebase_uid key are dropped from the API contract, and
    // `firebaseUid` is exposed instead. This strict .toEqual() assertion
    // catches any drift in the canonical /me shape.
    it("response data.user exposes canonical camelCase shape (T4 normalized)", async () => {
      const repositoryRow = {
        firebase_uid: "uid-1",
        deleted_at: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        name: "John",
        surname: "Doe",
        email: "stale@example.com",
        phone: "+1234567890",
        company: "Acme",
        linkedin: "https://linkedin.com/in/johndoe",
      };

      mockVerifyIdToken.mockResolvedValue(decodedToken);
      mockQuery.mockResolvedValueOnce({ rows: [repositoryRow] });
      mockGetFirebaseUser.mockResolvedValue({
        email: "john.canonical@example.com",
        customClaims: {},
      });

      const res = await request(app).get("/api/auth/me").set(authHeader());

      expect(res.status).toBe(200);

      // Exact canonical (T4) shape: only camelCase fields defined by
      // mapUserRow, with `email` sourced from Firebase canonicalization.
      expect(res.body.data.user).toEqual({
        firebaseUid: "uid-1",
        email: "john.canonical@example.com",
        name: "John",
        surname: "Doe",
        phone: "+1234567890",
        company: "Acme",
        linkedin: "https://linkedin.com/in/johndoe",
      });
    });

    it("canonicalizes email from Firebase even when DB email matches", async () => {
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
        email: "john@example.com",
        customClaims: {},
      });

      const res = await request(app).get("/api/auth/me").set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("john@example.com");
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
