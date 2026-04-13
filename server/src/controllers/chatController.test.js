import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockPrepareChat = vi.fn();
const mockPersistChat = vi.fn();
const mockCreateXaiStream = vi.fn();
const mockSetSSEHeaders = vi.fn();
const mockWriteSSE = vi.fn().mockReturnValue(true);
const mockEndSSE = vi.fn();
const mockEnqueueRetry = vi.fn().mockResolvedValue(undefined);
const mockWaitUntil = vi.fn();

vi.mock("../services/chatService.js", () => ({
  prepareChat: (...args) => mockPrepareChat(...args),
  persistChat: (...args) => mockPersistChat(...args),
  XAI_TIMEOUT_MS: 9500,
}));

vi.mock("../helpers/xaiStreamAdapter.js", () => ({
  createXaiStream: (...args) => mockCreateXaiStream(...args),
}));

vi.mock("../helpers/sseHelpers.js", () => ({
  setSSEHeaders: (...args) => mockSetSSEHeaders(...args),
  writeSSE: (...args) => mockWriteSSE(...args),
  endSSE: (...args) => mockEndSSE(...args),
  TOKEN_EVENT: "token",
  DONE_EVENT: "done",
  ERROR_EVENT: "error",
}));

vi.mock("../helpers/persistenceRetryQueue.js", () => ({
  enqueueRetry: (...args) => mockEnqueueRetry(...args),
}));

vi.mock("@vercel/functions", () => ({
  waitUntil: (...args) => mockWaitUntil(...args),
}));

vi.mock("../helpers/formatResponse.js", () => ({
  formatResponse: (data, msg) => ({ data, message: msg }),
}));

const { sendMessage } = await import("./chatController.js");

function createMockReq(overrides = {}) {
  const listeners = {};
  return {
    body: { question: "Hello" },
    user: { uid: "uid-1" },
    aborted: false,
    on(event, fn) {
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

function createMockRes(overrides = {}) {
  const listeners = {};
  return {
    destroyed: false,
    on(event, fn) {
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

async function* fakeStream(deltas) {
  for (const delta of deltas) {
    yield { delta };
  }
}

describe("chatController.sendMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful stream", () => {
    it("streams tokens then a single done with messageId and dailyCount, no errors", async () => {
      mockPrepareChat.mockResolvedValue({
        messages: [{ role: "user", content: "Hello" }],
        dailyCount: 2,
      });
      mockCreateXaiStream.mockReturnValue(fakeStream(["Hi", " there"]));
      mockPersistChat.mockResolvedValue({ messageId: "q-1" });

      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      await sendMessage(req, res, next);

      expect(mockPrepareChat).toHaveBeenCalledWith("uid-1", "Hello");
      expect(mockSetSSEHeaders).toHaveBeenCalledWith(res);
      expect(mockPersistChat).toHaveBeenCalledWith(
        "uid-1",
        "Hello",
        "Hi there",
      );

      const calls = mockWriteSSE.mock.calls;
      const tokenCalls = calls.filter((c) => c[1] === "token");
      const doneCalls = calls.filter((c) => c[1] === "done");
      const errorCalls = calls.filter((c) => c[1] === "error");

      expect(tokenCalls).toHaveLength(2);
      expect(tokenCalls[0][2]).toEqual({ delta: "Hi" });
      expect(tokenCalls[1][2]).toEqual({ delta: " there" });

      expect(doneCalls).toHaveLength(1);
      expect(doneCalls[0][2]).toEqual({ messageId: "q-1", dailyCount: 3 });

      expect(errorCalls).toHaveLength(0);

      // All token frames precede the done frame
      const lastTokenIdx = calls.findLastIndex((c) => c[1] === "token");
      const doneIdx = calls.findIndex((c) => c[1] === "done");
      expect(lastTokenIdx).toBeLessThan(doneIdx);

      expect(mockEndSSE).toHaveBeenCalledWith(res);
    });
  });

  describe("pre-stream interruption", () => {
    it("returns silently when req is aborted before stream", async () => {
      mockPrepareChat.mockResolvedValue({
        messages: [],
        dailyCount: 0,
      });

      const req = createMockReq({ aborted: true });
      const res = createMockRes();
      const next = vi.fn();

      await sendMessage(req, res, next);

      expect(mockSetSSEHeaders).not.toHaveBeenCalled();
      expect(mockWriteSSE).not.toHaveBeenCalled();
      expect(mockPersistChat).not.toHaveBeenCalled();
    });
  });

  describe("pre-stream interruption (async close during prepareChat)", () => {
    it("aborts when req close fires while prepareChat is pending", async () => {
      let resolvePrepare;
      mockPrepareChat.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePrepare = resolve;
          }),
      );

      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      const promise = sendMessage(req, res, next);

      // Simulate client disconnect while prepareChat is still awaiting
      req._emit("close");

      // Now let prepareChat resolve
      resolvePrepare({ messages: [], dailyCount: 0 });
      await promise;

      expect(mockSetSSEHeaders).not.toHaveBeenCalled();
      expect(mockCreateXaiStream).not.toHaveBeenCalled();
      expect(mockWriteSSE).not.toHaveBeenCalled();
      expect(mockPersistChat).not.toHaveBeenCalled();
    });
  });

  describe("post-loop interruption", () => {
    it("skips persistence when interrupted mid-stream", async () => {
      mockPrepareChat.mockResolvedValue({
        messages: [],
        dailyCount: 0,
      });

      // Capture the req "close" callback so we can trigger it mid-stream
      let closeCallback;
      const req = createMockReq();
      const originalOn = req.on.bind(req);
      req.on = (event, fn) => {
        if (event === "close") closeCallback = fn;
        originalOn(event, fn);
      };

      // Create a stream that triggers close during iteration
      mockCreateXaiStream.mockImplementation(() => ({
        async *[Symbol.asyncIterator]() {
          yield { delta: "Hi" };
          // Trigger close between yields — sets interrupted = true
          closeCallback();
          yield { delta: " more" };
        },
      }));

      const res = createMockRes();
      const next = vi.fn();

      await sendMessage(req, res, next);

      expect(mockPersistChat).not.toHaveBeenCalled();
      expect(mockEndSSE).toHaveBeenCalled();
    });
  });

  describe("persistence failure", () => {
    it("sends PERSIST_ERROR and enqueues retry", async () => {
      mockPrepareChat.mockResolvedValue({
        messages: [],
        dailyCount: 1,
      });
      mockCreateXaiStream.mockReturnValue(fakeStream(["Answer"]));
      mockPersistChat.mockRejectedValue(new Error("DB down"));

      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      await sendMessage(req, res, next);

      expect(mockWriteSSE).toHaveBeenCalledWith(res, "error", {
        code: "PERSIST_ERROR",
        message: "Failed to save conversation",
      });
      expect(mockEnqueueRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ userId: "uid-1" }),
      );
      expect(mockWaitUntil).toHaveBeenCalled();
      expect(mockEndSSE).toHaveBeenCalled();
    });
  });

  describe("xAI stream error", () => {
    it("sends STREAM_ERROR when createXaiStream throws", async () => {
      mockPrepareChat.mockResolvedValue({
        messages: [],
        dailyCount: 0,
      });
      // eslint-disable-next-line require-yield
      mockCreateXaiStream.mockImplementation(async function* () {
        throw new Error("xAI unavailable");
      });

      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      await sendMessage(req, res, next);

      expect(mockWriteSSE).toHaveBeenCalledWith(res, "error", {
        code: "STREAM_ERROR",
        message: "AI temporarily unavailable",
      });
      expect(mockEndSSE).toHaveBeenCalled();
    });
  });

  describe("prepareChat failure", () => {
    it("passes error to next middleware", async () => {
      const err = new Error("rate limit");
      err.statusCode = 429;
      mockPrepareChat.mockRejectedValue(err);

      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      await sendMessage(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(mockSetSSEHeaders).not.toHaveBeenCalled();
    });
  });
});
