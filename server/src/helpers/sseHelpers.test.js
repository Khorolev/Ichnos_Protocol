import { describe, it, expect, vi } from "vitest";
import {
  TOKEN_EVENT,
  DONE_EVENT,
  ERROR_EVENT,
  setSSEHeaders,
  writeSSE,
  endSSE,
  waitForFinish,
} from "./sseHelpers.js";

function createMockRes(overrides = {}) {
  const listeners = {};
  return {
    writableFinished: false,
    writableEnded: false,
    destroyed: false,
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
    once(event, fn) {
      listeners[event] = fn;
    },
    off(event) {
      delete listeners[event];
    },
    _emit(event) {
      if (listeners[event]) listeners[event]();
    },
    _listeners: listeners,
    ...overrides,
  };
}

describe("sseHelpers", () => {
  describe("constants", () => {
    it("TOKEN_EVENT equals 'token'", () => {
      expect(TOKEN_EVENT).toBe("token");
    });

    it("DONE_EVENT equals 'done'", () => {
      expect(DONE_EVENT).toBe("done");
    });

    it("ERROR_EVENT equals 'error'", () => {
      expect(ERROR_EVENT).toBe("error");
    });
  });

  describe("setSSEHeaders", () => {
    it("sets headers and calls flushHeaders", () => {
      const res = createMockRes();
      setSSEHeaders(res);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "text/event-stream",
      );
      expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-cache");
      expect(res.setHeader).toHaveBeenCalledWith(
        "Connection",
        "keep-alive",
      );
      expect(res.flushHeaders).toHaveBeenCalled();
    });
  });

  describe("writeSSE", () => {
    it("writes SSE-formatted frame and returns true", () => {
      const res = createMockRes();
      const result = writeSSE(res, "token", { delta: "Hello" });

      expect(result).toBe(true);
      expect(res.write).toHaveBeenCalledWith(
        'event: token\ndata: {"delta":"Hello"}\n\n',
      );
    });

    it("returns false when res.writableFinished is true", () => {
      const res = createMockRes({ writableFinished: true });
      const result = writeSSE(res, "token", { delta: "x" });

      expect(result).toBe(false);
      expect(res.write).not.toHaveBeenCalled();
    });

    it("returns false when res.destroyed is true", () => {
      const res = createMockRes({ destroyed: true });
      const result = writeSSE(res, "token", { delta: "x" });

      expect(result).toBe(false);
      expect(res.write).not.toHaveBeenCalled();
    });

    it("returns false when res.write throws", () => {
      const res = createMockRes();
      res.write.mockImplementation(() => {
        throw new Error("write failed");
      });

      const result = writeSSE(res, "token", { delta: "x" });

      expect(result).toBe(false);
    });
  });

  describe("endSSE", () => {
    it("calls res.end()", () => {
      const res = createMockRes();
      endSSE(res);
      expect(res.end).toHaveBeenCalled();
    });

    it("does nothing when res.writableFinished is true", () => {
      const res = createMockRes({ writableFinished: true });
      endSSE(res);
      expect(res.end).not.toHaveBeenCalled();
    });

    it("does nothing when res.writableEnded is true", () => {
      const res = createMockRes({ writableEnded: true });
      endSSE(res);
      expect(res.end).not.toHaveBeenCalled();
    });

    it("does nothing when res.destroyed is true", () => {
      const res = createMockRes({ destroyed: true });
      endSSE(res);
      expect(res.end).not.toHaveBeenCalled();
    });

    it("swallows error when res.end throws", () => {
      const res = createMockRes();
      res.end.mockImplementation(() => {
        throw new Error("end failed");
      });

      expect(() => endSSE(res)).not.toThrow();
    });
  });

  describe("waitForFinish", () => {
    it("resolves true immediately when writableFinished", async () => {
      const res = createMockRes({ writableFinished: true });
      const result = await waitForFinish(res);
      expect(result).toBe(true);
    });

    it("resolves false immediately when destroyed", async () => {
      const res = createMockRes({ destroyed: true });
      const result = await waitForFinish(res);
      expect(result).toBe(false);
    });

    it("resolves true when finish event fires", async () => {
      const res = createMockRes();
      const promise = waitForFinish(res);
      res._emit("finish");
      const result = await promise;
      expect(result).toBe(true);
    });

    it("resolves false when close event fires", async () => {
      const res = createMockRes();
      const promise = waitForFinish(res);
      res._emit("close");
      const result = await promise;
      expect(result).toBe(false);
    });

    it("cleans up the other listener after resolution", async () => {
      const res = createMockRes();
      const promise = waitForFinish(res);
      res._emit("finish");
      await promise;
      expect(res._listeners.close).toBeUndefined();
    });
  });
});
