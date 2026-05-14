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

function primeSyncProfileMocks(uid) {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ firebase_uid: uid }] })
    .mockResolvedValueOnce({
      rows: [{ user_id: uid, ...validProfile }],
    })
    .mockResolvedValueOnce({ rowCount: 1 });
  mockGetFirebaseUser.mockResolvedValue({
    email: "john@example.com",
    customClaims: { admin: false },
  });
}

describe("sync-profile auth boundary", () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
    mockGetFirebaseUser.mockReset();
    mockSetCustomUserClaims.mockReset();
    mockQuery.mockReset();
  });

  it("rejects unauthenticated request with 401", async () => {
    const res = await request(app)
      .post("/api/auth/sync-profile")
      .send({ firebaseUid: "uid-1", ...validProfile });

    expect(res.status).toBe(401);
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it("ignores body firebaseUid and uses token UID as identity", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "token-uid" });
    primeSyncProfileMocks("token-uid");

    await request(app)
      .post("/api/auth/sync-profile")
      .set("Authorization", "Bearer valid-token")
      .send({ firebaseUid: "attacker-uid", ...validProfile });

    expect(mockGetFirebaseUser).toHaveBeenCalledWith("token-uid");
    expect(mockGetFirebaseUser).not.toHaveBeenCalledWith("attacker-uid");
  });

  it("returns 200 with profile data for valid body", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "uid-1" });
    primeSyncProfileMocks("uid-1");

    const res = await request(app)
      .post("/api/auth/sync-profile")
      .set("Authorization", "Bearer valid-token")
      .send(validProfile);

    expect(res.status).toBe(200);
    expect(res.body.data.profile).toBeDefined();
    expect(res.body.data.isAdmin).toBeDefined();
    expect(res.body.data.profileState).toBeDefined();
  });

  it("allows missing firebaseUid in body (no longer required)", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "uid-1" });
    primeSyncProfileMocks("uid-1");

    const res = await request(app)
      .post("/api/auth/sync-profile")
      .set("Authorization", "Bearer valid-token")
      .send(validProfile);

    expect(res.status).toBe(200);
  });

  it("authenticated request with mismatched body UID uses token UID, returns 200", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "token-uid",
      email: "token@example.com",
    });
    primeSyncProfileMocks("token-uid");

    const res = await request(app)
      .post("/api/auth/sync-profile")
      .set("Authorization", "Bearer valid-token")
      .send({ firebaseUid: "body-uid", ...validProfile });

    expect(res.status).toBe(200);
    expect(mockVerifyIdToken).toHaveBeenCalled();
    expect(mockGetFirebaseUser).toHaveBeenCalledWith("token-uid");
    expect(mockGetFirebaseUser).not.toHaveBeenCalledWith("body-uid");
  });

  it("returns 400 when a profile field violates the schema", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "uid-1" });

    const res = await request(app)
      .post("/api/auth/sync-profile")
      .set("Authorization", "Bearer valid-token")
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
  });
});
