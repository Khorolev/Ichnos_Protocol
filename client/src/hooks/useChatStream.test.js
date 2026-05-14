import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { createElement } from "react";

import chatReducer from "../features/chat/chatSlice";
import { chatApi } from "../features/chat/chatApi";

const mockStreamChatMessage = vi.fn();

vi.mock("../helpers/chatStreamClient", () => ({
  streamChatMessage: (...args) => mockStreamChatMessage(...args),
}));

vi.mock("../config/firebase", () => ({
  auth: {
    currentUser: { getIdToken: () => Promise.resolve("mock-token") },
  },
}));

const { useChatStream } = await import("./useChatStream.js");

function createTestStore() {
  return configureStore({
    reducer: {
      chat: chatReducer,
      [chatApi.reducerPath]: chatApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(chatApi.middleware),
  });
}

function renderWithStore(store) {
  return renderHook(() => useChatStream(), {
    wrapper: ({ children }) =>
      createElement(Provider, { store }, children),
  });
}

describe("useChatStream", () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("onDone callback", () => {
    it("dispatches addMessage, setDailyCount, and setLoading(false)", async () => {
      mockStreamChatMessage.mockImplementation(
        (_question, _token, callbacks) => {
          // Simulate token then done
          callbacks.onToken({ delta: "Answer" });
          callbacks.onDone({ dailyCount: 2 });
          return Promise.resolve();
        },
      );

      const { result } = renderWithStore(store);

      await act(async () => {
        await result.current.sendStreamMessage("test question");
      });

      const state = store.getState().chat;
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].role).toBe("ai");
      expect(state.messages[0].content).toBe("Answer");
      expect(state.dailyCount).toBe(2);
      expect(state.loading).toBe(false);
    });
  });

  describe("onError callback", () => {
    it("dispatches setError('rate_limit') for RATE_LIMIT code", async () => {
      mockStreamChatMessage.mockImplementation(
        (question, token, callbacks) => {
          callbacks.onError({ code: "RATE_LIMIT" });
          return Promise.resolve();
        },
      );

      const { result } = renderWithStore(store);

      await act(async () => {
        await result.current.sendStreamMessage("test");
      });

      expect(store.getState().chat.error).toBe("rate_limit");
    });

    it("dispatches setError('ai_unavailable') for STREAM_ERROR code", async () => {
      mockStreamChatMessage.mockImplementation(
        (question, token, callbacks) => {
          callbacks.onError({ code: "STREAM_ERROR" });
          return Promise.resolve();
        },
      );

      const { result } = renderWithStore(store);

      await act(async () => {
        await result.current.sendStreamMessage("test");
      });

      expect(store.getState().chat.error).toBe("ai_unavailable");
    });

    it("dispatches setError('generic') for unknown codes", async () => {
      mockStreamChatMessage.mockImplementation(
        (question, token, callbacks) => {
          callbacks.onError({ code: "UNKNOWN_CODE" });
          return Promise.resolve();
        },
      );

      const { result } = renderWithStore(store);

      await act(async () => {
        await result.current.sendStreamMessage("test");
      });

      expect(store.getState().chat.error).toBe("generic");
    });
  });

  describe("AbortError handling", () => {
    it("returns 'aborted' outcome and sets loading false", async () => {
      mockStreamChatMessage.mockRejectedValue({ name: "AbortError" });

      const { result } = renderWithStore(store);

      let outcome;
      await act(async () => {
        outcome = await result.current.sendStreamMessage("test");
      });

      expect(outcome).toBe("aborted");
      expect(store.getState().chat.loading).toBe(false);
    });
  });

  describe("pre-stream HTTP error mapping", () => {
    it("dispatches setError('rate_limit') for status 429", async () => {
      mockStreamChatMessage.mockRejectedValue({ status: 429 });

      const { result } = renderWithStore(store);

      await act(async () => {
        await result.current.sendStreamMessage("test");
      });

      expect(store.getState().chat.error).toBe("rate_limit");
    });

    it("dispatches setError('ai_unavailable') for status 503", async () => {
      mockStreamChatMessage.mockRejectedValue({ status: 503 });

      const { result } = renderWithStore(store);

      await act(async () => {
        await result.current.sendStreamMessage("test");
      });

      expect(store.getState().chat.error).toBe("ai_unavailable");
    });

    it("dispatches setError('generic') for status 500", async () => {
      mockStreamChatMessage.mockRejectedValue({ status: 500 });

      const { result } = renderWithStore(store);

      await act(async () => {
        await result.current.sendStreamMessage("test");
      });

      expect(store.getState().chat.error).toBe("generic");
    });
  });
});
