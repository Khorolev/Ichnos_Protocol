import { describe, it, expect, vi, beforeEach } from "vitest";

const mockVerifyIdToken = vi.fn();

vi.mock("../config/firebase.js", () => ({
  default: {
    auth: () => ({ verifyIdToken: mockVerifyIdToken }),
  },
}));

const { default: auth } = await import("./auth.js");

function createMockRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
}

describe("auth middleware", () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset();
  });

  it("returns 401 when authorization header is missing", async () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = vi.fn();

    await auth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Missing or malformed authorization token");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when authorization header has wrong format", async () => {
    const req = { headers: { authorization: "Token abc123" } };
    const res = createMockRes();
    const next = vi.fn();

    await auth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches decoded user and calls next on valid token", async () => {
    const decoded = { uid: "user-123", email: "test@test.com" };
    mockVerifyIdToken.mockResolvedValue(decoded);

    const req = { headers: { authorization: "Bearer valid-token" } };
    const res = createMockRes();
    const next = vi.fn();

    await auth(req, res, next);

    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 401 with expiry message on expired token", async () => {
    mockVerifyIdToken.mockRejectedValue({ code: "auth/id-token-expired" });

    const req = { headers: { authorization: "Bearer expired-token" } };
    const res = createMockRes();
    const next = vi.fn();

    await auth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Token has expired");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 with revoked message on revoked token", async () => {
    mockVerifyIdToken.mockRejectedValue({ code: "auth/id-token-revoked" });

    const req = { headers: { authorization: "Bearer revoked-token" } };
    const res = createMockRes();
    const next = vi.fn();

    await auth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Token has been revoked");
  });

  it("returns 401 with generic message on other errors", async () => {
    mockVerifyIdToken.mockRejectedValue({ code: "auth/argument-error" });

    const req = { headers: { authorization: "Bearer bad-token" } };
    const res = createMockRes();
    const next = vi.fn();

    await auth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid authentication token");
  });
});
