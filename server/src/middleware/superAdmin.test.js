import { describe, it, expect, vi } from "vitest";
import superAdmin from "./superAdmin.js";

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

describe("superAdmin middleware", () => {
  it("calls next when user has superAdmin claim", () => {
    const req = { user: { uid: "super-1", superAdmin: true } };
    const res = createMockRes();
    const next = vi.fn();

    superAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBeNull();
  });

  it("returns 403 when user lacks superAdmin claim", () => {
    const req = { user: { uid: "user-1" } };
    const res = createMockRes();
    const next = vi.fn();

    superAdmin(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("Forbidden: Super-admin access required");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when superAdmin claim is false", () => {
    const req = { user: { uid: "user-2", superAdmin: false } };
    const res = createMockRes();
    const next = vi.fn();

    superAdmin(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when req.user is undefined", () => {
    const req = {};
    const res = createMockRes();
    const next = vi.fn();

    superAdmin(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when superAdmin claim is not true", () => {
    const req = { user: { uid: "user-3", superAdmin: "yes" } };
    const res = createMockRes();
    const next = vi.fn();

    superAdmin(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});
