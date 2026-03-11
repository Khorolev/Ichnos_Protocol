import { describe, it, expect, vi } from "vitest";
import admin from "./admin.js";

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

describe("admin middleware", () => {
  it("calls next when user has admin claim", () => {
    const req = { user: { uid: "admin-1", admin: true } };
    const res = createMockRes();
    const next = vi.fn();

    admin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBeNull();
  });

  it("returns 403 when user lacks admin claim", () => {
    const req = { user: { uid: "user-1" } };
    const res = createMockRes();
    const next = vi.fn();

    admin(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("Forbidden: Admin access required");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when admin claim is false", () => {
    const req = { user: { uid: "user-2", admin: false } };
    const res = createMockRes();
    const next = vi.fn();

    admin(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when req.user is undefined", () => {
    const req = {};
    const res = createMockRes();
    const next = vi.fn();

    admin(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when admin claim is not true", () => {
    const req = { user: { uid: "user-3", admin: "yes" } };
    const res = createMockRes();
    const next = vi.fn();

    admin(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});
