import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("../constants/api", () => ({ API_BASE_URL: "http://test" }));

const { streamChatMessage } = await import("./chatStreamClient.js");

function encodeSSEFrames(frames) {
  const encoder = new TextEncoder();
  const text = frames
    .map((f) => `event: ${f.event}\ndata: ${JSON.stringify(f.data)}\n\n`)
    .join("");
  const encoded = encoder.encode(text);
  let index = 0;

  return {
    getReader() {
      return {
        read() {
          if (index === 0) {
            index++;
            return Promise.resolve({ done: false, value: encoded });
          }
          return Promise.resolve({ done: true, value: undefined });
        },
      };
    },
  };
}

function mockFetchSSE(frames) {
  return vi.fn().mockResolvedValue({
    ok: true,
    body: encodeSSEFrames(frames),
  });
}

describe("chatStreamClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("token/done/error frame parsing", () => {
    it("calls onToken for each token event frame", async () => {
      const onToken = vi.fn();
      const onDone = vi.fn();
      const onError = vi.fn();

      globalThis.fetch = mockFetchSSE([
        { event: "token", data: { delta: "Hi" } },
        { event: "token", data: { delta: " there" } },
        { event: "done", data: { dailyCount: 1 } },
      ]);

      await streamChatMessage("q", "tok", {
        onToken,
        onDone,
        onError,
        signal: new AbortController().signal,
      });

      expect(onToken).toHaveBeenCalledTimes(2);
      expect(onToken).toHaveBeenCalledWith({ delta: "Hi" });
      expect(onToken).toHaveBeenCalledWith({ delta: " there" });
    });

    it("calls onDone for done event frame", async () => {
      const onToken = vi.fn();
      const onDone = vi.fn();
      const onError = vi.fn();

      globalThis.fetch = mockFetchSSE([
        { event: "token", data: { delta: "x" } },
        { event: "done", data: { dailyCount: 2 } },
      ]);

      await streamChatMessage("q", "tok", {
        onToken,
        onDone,
        onError,
        signal: new AbortController().signal,
      });

      expect(onDone).toHaveBeenCalledWith({ dailyCount: 2 });
    });

    it("calls onError for error event frame", async () => {
      const onToken = vi.fn();
      const onDone = vi.fn();
      const onError = vi.fn();

      globalThis.fetch = mockFetchSSE([
        { event: "error", data: { code: "STREAM_ERROR", message: "fail" } },
      ]);

      await streamChatMessage("q", "tok", {
        onToken,
        onDone,
        onError,
        signal: new AbortController().signal,
      });

      expect(onError).toHaveBeenCalledWith({
        code: "STREAM_ERROR",
        message: "fail",
      });
    });
  });

  describe("multi-chunk buffering", () => {
    it("handles a frame split across two chunks", async () => {
      const onToken = vi.fn();
      const onDone = vi.fn();
      const onError = vi.fn();

      const encoder = new TextEncoder();
      const fullText =
        `event: token\ndata: ${JSON.stringify({ delta: "Hi" })}\n\n` +
        `event: done\ndata: ${JSON.stringify({ dailyCount: 1 })}\n\n`;

      // Split in the middle of the done frame
      const splitPoint = fullText.indexOf("event: done") + 5;
      const chunk1 = encoder.encode(fullText.slice(0, splitPoint));
      const chunk2 = encoder.encode(fullText.slice(splitPoint));

      let callIndex = 0;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader() {
            return {
              read() {
                if (callIndex === 0) {
                  callIndex++;
                  return Promise.resolve({ done: false, value: chunk1 });
                }
                if (callIndex === 1) {
                  callIndex++;
                  return Promise.resolve({ done: false, value: chunk2 });
                }
                return Promise.resolve({ done: true, value: undefined });
              },
            };
          },
        },
      });

      await streamChatMessage("q", "tok", {
        onToken,
        onDone,
        onError,
        signal: new AbortController().signal,
      });

      expect(onToken).toHaveBeenCalledTimes(1);
      expect(onToken).toHaveBeenCalledWith({ delta: "Hi" });
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledWith({ dailyCount: 1 });
      expect(onError).not.toHaveBeenCalled();
    });

    it("handles error event arriving in a later chunk", async () => {
      const onToken = vi.fn();
      const onDone = vi.fn();
      const onError = vi.fn();

      const encoder = new TextEncoder();
      const tokenFrame = `event: token\ndata: ${JSON.stringify({ delta: "partial" })}\n\n`;
      const errorFrame = `event: error\ndata: ${JSON.stringify({ code: "STREAM_ERROR", message: "fail" })}\n\n`;

      const chunk1 = encoder.encode(tokenFrame);
      const chunk2 = encoder.encode(errorFrame);

      let callIndex = 0;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader() {
            return {
              read() {
                if (callIndex === 0) {
                  callIndex++;
                  return Promise.resolve({ done: false, value: chunk1 });
                }
                if (callIndex === 1) {
                  callIndex++;
                  return Promise.resolve({ done: false, value: chunk2 });
                }
                return Promise.resolve({ done: true, value: undefined });
              },
            };
          },
        },
      });

      await streamChatMessage("q", "tok", {
        onToken,
        onDone,
        onError,
        signal: new AbortController().signal,
      });

      expect(onToken).toHaveBeenCalledTimes(1);
      expect(onToken).toHaveBeenCalledWith({ delta: "partial" });
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith({
        code: "STREAM_ERROR",
        message: "fail",
      });
      expect(onDone).not.toHaveBeenCalled();
    });
  });

  describe("premature EOF", () => {
    it("calls onError with STREAM_EOF when no terminal event", async () => {
      const onToken = vi.fn();
      const onDone = vi.fn();
      const onError = vi.fn();

      globalThis.fetch = mockFetchSSE([
        { event: "token", data: { delta: "partial" } },
      ]);

      await streamChatMessage("q", "tok", {
        onToken,
        onDone,
        onError,
        signal: new AbortController().signal,
      });

      expect(onError).toHaveBeenCalledWith({
        code: "STREAM_EOF",
        message: "Stream ended unexpectedly",
      });
    });
  });

  describe("pre-stream HTTP error", () => {
    it("throws with status 429 when response is not ok", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () =>
          Promise.resolve({ error: "Rate limit exceeded" }),
      });

      const error = await streamChatMessage("q", "tok", {
        onToken: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
        signal: new AbortController().signal,
      }).catch((e) => e);

      expect(error.status).toBe(429);
      expect(error.data).toEqual({ error: "Rate limit exceeded" });
    });

    it("throws with status 401 when unauthorized", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({ error: "Unauthorized" }),
      });

      const error = await streamChatMessage("q", "tok", {
        onToken: vi.fn(),
        onDone: vi.fn(),
        onError: vi.fn(),
        signal: new AbortController().signal,
      }).catch((e) => e);

      expect(error.status).toBe(401);
      expect(error.data).toEqual({ error: "Unauthorized" });
    });
  });
});
