import { describe, it, expect, vi } from "vitest";
import { z } from "zod/v4";
import { validateRequest } from "./validation.js";

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

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

describe("validateRequest middleware", () => {
  it("calls next when body is valid", () => {
    const middleware = validateRequest(testSchema);
    const req = { body: { name: "Alice", age: 25 } };
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBeNull();
  });

  it("replaces req.body with parsed data (strips unknown fields)", () => {
    const middleware = validateRequest(testSchema);
    const req = { body: { name: "Bob", age: 30, extra: "ignored" } };
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(req.body).toEqual({ name: "Bob", age: 30 });
    expect(req.body.extra).toBeUndefined();
  });

  it("returns 400 with errors when body is invalid", () => {
    const middleware = validateRequest(testSchema);
    const req = { body: { name: "", age: -1 } };
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Validation failed");
    expect(Array.isArray(res.body.error)).toBe(true);
    expect(res.body.error.length).toBeGreaterThan(0);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 when required fields are missing", () => {
    const middleware = validateRequest(testSchema);
    const req = { body: {} };
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.body.error.length).toBe(2);
    expect(next).not.toHaveBeenCalled();
  });

  it("includes field path in error details", () => {
    const middleware = validateRequest(testSchema);
    const req = { body: { name: 123, age: "not-a-number" } };
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    const paths = res.body.error.map((e) => e.path);
    expect(paths).toContain("name");
    expect(paths).toContain("age");
  });
});
