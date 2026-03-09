import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockAuth = vi.fn();
const mockAdmin = vi.fn();

vi.mock("./auth.js", () => ({ default: (...args) => mockAuth(...args) }));
vi.mock("./admin.js", () => ({ default: (...args) => mockAdmin(...args) }));

const { default: cronOrAdmin } = await import("./cronAuth.js");

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

describe("cronOrAdmin middleware", () => {
  let originalCronSecret;

  beforeEach(() => {
    originalCronSecret = process.env.CRON_SECRET;
    mockAuth.mockReset();
    mockAdmin.mockReset();
  });

  afterEach(() => {
    if (originalCronSecret !== undefined) {
      process.env.CRON_SECRET = originalCronSecret;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  it("calls next immediately with valid CRON_SECRET Bearer token", () => {
    process.env.CRON_SECRET = "my-secret";
    const req = { headers: { authorization: "Bearer my-secret" } };
    const res = createMockRes();
    const next = vi.fn();

    cronOrAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockAdmin).not.toHaveBeenCalled();
  });

  it("falls through to auth chain with wrong Bearer secret", () => {
    process.env.CRON_SECRET = "my-secret";
    mockAuth.mockImplementation((_req, _res, cb) => cb());
    mockAdmin.mockImplementation((_req, _res, cb) => cb());

    const req = { headers: { authorization: "Bearer wrong" } };
    const res = createMockRes();
    const next = vi.fn();

    cronOrAdmin(req, res, next);

    expect(mockAuth).toHaveBeenCalledOnce();
    expect(mockAdmin).toHaveBeenCalledOnce();
  });

  it("falls through to auth chain when Authorization header is missing", () => {
    process.env.CRON_SECRET = "my-secret";
    mockAuth.mockImplementation((_req, _res, cb) => cb());
    mockAdmin.mockImplementation((_req, _res, cb) => cb());

    const req = { headers: {} };
    const res = createMockRes();
    const next = vi.fn();

    cronOrAdmin(req, res, next);

    expect(mockAuth).toHaveBeenCalledOnce();
  });

  it("falls through to auth chain when CRON_SECRET is not configured", () => {
    delete process.env.CRON_SECRET;
    mockAuth.mockImplementation((_req, _res, cb) => cb());
    mockAdmin.mockImplementation((_req, _res, cb) => cb());

    const req = { headers: { authorization: "Bearer anything" } };
    const res = createMockRes();
    const next = vi.fn();

    cronOrAdmin(req, res, next);

    expect(mockAuth).toHaveBeenCalledOnce();
  });

  it("calls next via admin chain when auth and admin both pass", () => {
    delete process.env.CRON_SECRET;
    mockAuth.mockImplementation((_req, _res, cb) => cb());
    mockAdmin.mockImplementation((_req, _res, cb) => cb());

    const req = { headers: {} };
    const res = createMockRes();
    const next = vi.fn();

    cronOrAdmin(req, res, next);

    expect(mockAuth).toHaveBeenCalledOnce();
    expect(mockAdmin).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
  });

  it("calls next with auth error when auth middleware fails", () => {
    delete process.env.CRON_SECRET;
    const authError = new Error("Unauthorized");
    mockAuth.mockImplementation((_req, _res, cb) => cb(authError));

    const req = { headers: {} };
    const res = createMockRes();
    const next = vi.fn();

    cronOrAdmin(req, res, next);

    expect(mockAuth).toHaveBeenCalledOnce();
    expect(mockAdmin).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(authError);
  });
});
