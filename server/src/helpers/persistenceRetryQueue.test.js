import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { enqueueRetry } from "./persistenceRetryQueue.js";

describe("persistenceRetryQueue", () => {
  let infoSpy, warnSpy, errorSpy;

  beforeEach(() => {
    vi.useFakeTimers();
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("enqueueRetry", () => {
    it("succeeds immediately on first attempt", async () => {
      const retryFn = vi.fn().mockResolvedValue(undefined);
      const context = { userId: "u1" };

      const promise = enqueueRetry(retryFn, context);
      await vi.advanceTimersByTimeAsync(0);
      await promise;

      expect(retryFn).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        "[PERSIST_RETRY_QUEUED]",
        expect.objectContaining({ userId: "u1" }),
      );
      expect(infoSpy).toHaveBeenCalledWith(
        "[PERSIST_RETRY_ATTEMPT]",
        expect.objectContaining({ attempt: 1 }),
      );
      expect(infoSpy).toHaveBeenCalledWith(
        "[PERSIST_RETRY_SUCCESS]",
        expect.objectContaining({ attempt: 1 }),
      );
    });

    it("retries on first failure and succeeds on attempt 2", async () => {
      const retryFn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce(undefined);
      const context = { userId: "u2" };

      const promise = enqueueRetry(retryFn, context);

      // Let attempt 1 fail
      await vi.advanceTimersByTimeAsync(0);
      // Advance past backoff delay (1000ms for attempt 1)
      await vi.advanceTimersByTimeAsync(1000);
      await promise;

      expect(retryFn).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledWith(
        "[PERSIST_RETRY_BACKOFF]",
        expect.objectContaining({ attempt: 1, nextAttemptIn: 1000 }),
      );
      expect(infoSpy).toHaveBeenCalledWith(
        "[PERSIST_RETRY_SUCCESS]",
        expect.objectContaining({ attempt: 2 }),
      );
    });

    it("exhausts all 3 retries then logs exhausted", async () => {
      const retryFn = vi.fn().mockRejectedValue(new Error("always fail"));
      const context = { userId: "u3" };

      const promise = enqueueRetry(retryFn, context);

      // Attempt 1 fails, backoff 1000ms
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000);
      // Attempt 2 fails, backoff 2000ms
      await vi.advanceTimersByTimeAsync(2000);
      // Attempt 3 fails, exhausted
      await vi.advanceTimersByTimeAsync(0);
      await promise;

      expect(retryFn).toHaveBeenCalledTimes(3);
      expect(errorSpy).toHaveBeenCalledWith(
        "[PERSIST_RETRY_EXHAUSTED]",
        expect.objectContaining({ attempts: 3 }),
      );
    });

    it("includes context labels in all log messages", async () => {
      const retryFn = vi.fn().mockResolvedValue(undefined);
      const context = { userId: "u1", question: "test" };

      const promise = enqueueRetry(retryFn, context);
      await vi.advanceTimersByTimeAsync(0);
      await promise;

      expect(warnSpy).toHaveBeenCalledWith(
        "[PERSIST_RETRY_QUEUED]",
        expect.objectContaining({ userId: "u1", question: "test" }),
      );
      expect(infoSpy).toHaveBeenCalledWith(
        "[PERSIST_RETRY_ATTEMPT]",
        expect.objectContaining({ userId: "u1", question: "test" }),
      );
    });

    it("does not throw even when retryFn always fails", async () => {
      const retryFn = vi.fn().mockRejectedValue(new Error("boom"));

      const promise = enqueueRetry(retryFn, {});

      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(0);

      await expect(promise).resolves.toBeUndefined();
    });
  });
});
