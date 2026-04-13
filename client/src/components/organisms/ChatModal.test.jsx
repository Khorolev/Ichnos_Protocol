import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";

import chatReducer from "../../features/chat/chatSlice";
import authReducer from "../../features/auth/authSlice";

const mockSendStreamMessage = vi.fn().mockResolvedValue("completed");
const mockTriggerHistory = vi.fn().mockReturnValue({
  unwrap: () => Promise.resolve({ data: [] }),
});

vi.mock("../../hooks/useChatStream", () => ({
  useChatStream: () => ({
    streamingText: "",
    isStreaming: false,
    sendStreamMessage: mockSendStreamMessage,
    cancelStream: vi.fn(),
  }),
}));

vi.mock("../../features/chat/chatApi", () => ({
  useLazyGetHistoryQuery: () => [mockTriggerHistory],
  chatApi: {
    reducerPath: "chatApi",
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

vi.mock("../../helpers/chatMessageMapper", () => ({
  mapHistoryToMessages: vi.fn((data) => data ?? []),
}));

vi.mock("../../config/firebase", () => ({
  auth: { currentUser: null },
}));

vi.mock("../../features/contact/contactSlice", () => ({
  openModal: vi.fn(() => ({ type: "contact/openModal" })),
}));

function createStore(overrides = {}) {
  return configureStore({
    reducer: { auth: authReducer, chat: chatReducer },
    preloadedState: {
      auth: {
        user: { uid: "u1" },
        isAuthenticated: true,
        isAdmin: false,
        loading: false,
        error: null,
        modalMode: null,
        profileState: null,
        authSuccess: false,
        enforcedLogout: false,
        ...overrides.auth,
      },
      chat: {
        messages: [],
        isOpen: true,
        loading: false,
        error: null,
        dailyCount: 0,
        ...overrides.chat,
      },
    },
  });
}

describe("ChatModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders existing messages", async () => {
    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore({
      chat: {
        messages: [
          { role: "user", content: "Hello", timestamp: "2025-01-01T00:00:00Z" },
          {
            role: "ai",
            content: "Hi there",
            timestamp: "2025-01-01T00:00:01Z",
          },
        ],
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there")).toBeInTheDocument();
  });

  it("displays daily count with correct limit", async () => {
    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore({ chat: { dailyCount: 2 } });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText("Messages today: 2 / 3")).toBeInTheDocument();
  });

  it("dispatches openAuthModal for unauthenticated users when modal opens", async () => {
    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore({
      auth: { isAuthenticated: false, user: null },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    expect(store.getState().auth.modalMode).toBe("login");
  });

  it("dispatches user message and calls sendStreamMessage on send", async () => {
    const user = userEvent.setup();

    mockTriggerHistory.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          data: [
            { role: "user", content: "Test question", timestamp: "2025-01-01T00:00:00Z" },
          ],
        }),
    });

    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore();

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    const textarea = screen.getByPlaceholderText("Type your message...");
    await user.type(textarea, "Test question");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(mockSendStreamMessage).toHaveBeenCalledWith("Test question");
      expect(store.getState().chat.messages).toHaveLength(1);
      expect(store.getState().chat.messages[0].content).toBe("Test question");
    });
  });

  it("shows rate limit alert when error state is rate_limit", async () => {
    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore({ chat: { error: "rate_limit" } });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    expect(
      screen.getByText(/reached your daily message limit/i),
    ).toBeInTheDocument();
  });

  it("shows AI unavailable alert with contact CTA when error state is ai_unavailable", async () => {
    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore({ chat: { error: "ai_unavailable" } });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /leave your question/i }),
    ).toBeInTheDocument();
  });

  it("shows generic error when error state is generic", async () => {
    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore({ chat: { error: "generic" } });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("does not reopen auth modal after enforced logout", async () => {
    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore({
      auth: { isAuthenticated: false, user: null, enforcedLogout: true },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    expect(store.getState().auth.modalMode).toBeNull();
  });

  it("clears pending message on enforced logout", async () => {
    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore({
      auth: { isAuthenticated: false, user: null, enforcedLogout: false },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    act(() => {
      store.dispatch({ type: "auth/setEnforcedLogout", payload: true });
    });

    act(() => {
      store.dispatch({ type: "auth/setEnforcedLogout", payload: false });
      store.dispatch({ type: "auth/setUser", payload: { uid: "u1" } });
      store.dispatch({ type: "auth/setAuthSuccess", payload: true });
    });

    await waitFor(() => {
      expect(store.getState().auth.authSuccess).toBe(true);
    });
  });

  it("does not auto-resume deferred work after enforced logout and later login", async () => {
    const user = userEvent.setup();

    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore({
      auth: { isAuthenticated: false, user: null },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    // Simulate unauthenticated send to create pending work
    const textarea = screen.getByPlaceholderText("Type your message...");
    await user.type(textarea, "Pending question");
    await user.click(screen.getByRole("button", { name: "Send" }));

    // Enforced logout should clear the pending message (mirrors AuthModal.handleLogout)
    act(() => {
      store.dispatch({ type: "auth/setEnforcedLogout", payload: true });
      store.dispatch({ type: "auth/forceCloseAuthModal" });
    });

    // Simulate a later auth success — pending work must NOT replay
    act(() => {
      store.dispatch({ type: "auth/setEnforcedLogout", payload: false });
      store.dispatch({ type: "auth/setUser", payload: { uid: "u1" } });
      store.dispatch({ type: "auth/setAuthSuccess", payload: true });
    });

    await waitFor(() => {
      expect(mockSendStreamMessage).not.toHaveBeenCalled();
    });

    // Auth modal should not have reopened from stale pending action
    expect(store.getState().auth.modalMode).toBeNull();
  });

  it("hides input area when rate limited", async () => {
    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore({ chat: { error: "rate_limit" } });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    expect(
      screen.queryByPlaceholderText("Type your message..."),
    ).not.toBeInTheDocument();
  });

  it("does not replace conversation with history after aborted send", async () => {
    const user = userEvent.setup();

    let resolveSend;
    mockSendStreamMessage.mockImplementation(
      () => new Promise((r) => { resolveSend = r; }),
    );

    // First call: modal-open hydration (empty). Later calls: stale history.
    let callCount = 0;
    mockTriggerHistory.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { unwrap: () => Promise.resolve({ data: [] }) };
      }
      return {
        unwrap: () =>
          Promise.resolve({
            data: [
              { role: "user", content: "Old msg", timestamp: "2025-01-01T00:00:00Z" },
            ],
          }),
      };
    });

    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore();

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    // Wait for initial hydration to complete
    await waitFor(() => {
      expect(mockTriggerHistory).toHaveBeenCalledTimes(1);
    });

    const textarea = screen.getByPlaceholderText("Type your message...");
    await user.type(textarea, "My question");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(store.getState().chat.messages).toHaveLength(1);
      expect(store.getState().chat.messages[0].content).toBe("My question");
    });

    // Simulate aborted send returning "aborted" outcome
    await act(async () => { resolveSend("aborted"); });

    // sendStreamMessage resolved with "aborted" — no additional triggerHistory
    await waitFor(() => {
      expect(mockTriggerHistory).toHaveBeenCalledTimes(1);
    });

    // The optimistic message must still be intact
    expect(store.getState().chat.messages).toHaveLength(1);
    expect(store.getState().chat.messages[0].content).toBe("My question");
  });

  it("does not overwrite streamed conversation with stale history", async () => {
    const user = userEvent.setup();

    let resolveSend;
    mockSendStreamMessage.mockImplementation(
      () => new Promise((r) => { resolveSend = r; }),
    );

    const freshHistory = [
      { role: "user", content: "Hello", timestamp: "2025-01-01T00:00:00Z" },
      { role: "ai", content: "Hi from server", timestamp: "2025-01-01T00:00:01Z" },
    ];

    // First call: modal-open hydration (empty).
    // Second call: post-send refresh (fresh data).
    let callCount = 0;
    mockTriggerHistory.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { unwrap: () => Promise.resolve({ data: [] }) };
      }
      return { unwrap: () => Promise.resolve({ data: freshHistory }) };
    });

    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore();

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    // Wait for initial hydration to complete
    await waitFor(() => {
      expect(mockTriggerHistory).toHaveBeenCalledTimes(1);
    });

    const textarea = screen.getByPlaceholderText("Type your message...");
    await user.type(textarea, "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(store.getState().chat.messages).toHaveLength(1);
      expect(store.getState().chat.messages[0].content).toBe("Hello");
    });

    // sendPendingRef.current is true, so no stale data can overwrite
    expect(store.getState().chat.messages[0].content).toBe("Hello");

    await act(async () => { resolveSend("completed"); });

    // Post-send lazy query should be called for authoritative refresh
    await waitFor(() => {
      expect(mockTriggerHistory).toHaveBeenCalledTimes(2);
      expect(store.getState().chat.messages).toEqual(freshHistory);
    });
  });

  it("late modal-open history does not overwrite post-send authoritative refresh", async () => {
    const user = userEvent.setup();

    let resolveSend;
    mockSendStreamMessage.mockImplementation(
      () => new Promise((r) => { resolveSend = r; }),
    );

    const staleModalHistory = [
      { role: "user", content: "Old stale msg", timestamp: "2025-01-01T00:00:00Z" },
    ];
    const freshPostSendHistory = [
      { role: "user", content: "Hello", timestamp: "2025-01-02T00:00:00Z" },
      { role: "ai", content: "Fresh reply", timestamp: "2025-01-02T00:00:01Z" },
    ];

    // First call (modal-open hydration): resolves slowly
    // Second call (post-send refresh): resolves with fresh data
    let resolveModalOpen;
    const slowModalPromise = new Promise((r) => { resolveModalOpen = r; });

    let callCount = 0;
    mockTriggerHistory.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { unwrap: () => slowModalPromise };
      }
      return {
        unwrap: () => Promise.resolve({ data: freshPostSendHistory }),
      };
    });

    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore();

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    // Modal-open hydration was triggered (call 1) but hasn't resolved yet
    await waitFor(() => {
      expect(mockTriggerHistory).toHaveBeenCalledTimes(1);
    });

    // User sends a message before modal-open fetch resolves
    const textarea = screen.getByPlaceholderText("Type your message...");
    await user.type(textarea, "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(store.getState().chat.messages).toHaveLength(1);
      expect(store.getState().chat.messages[0].content).toBe("Hello");
    });

    // Complete the send — triggers post-send refresh (call 2)
    await act(async () => { resolveSend("completed"); });

    await waitFor(() => {
      expect(mockTriggerHistory).toHaveBeenCalledTimes(2);
      expect(store.getState().chat.messages).toEqual(freshPostSendHistory);
    });

    // Now the slow modal-open fetch resolves with stale data
    await act(async () => {
      resolveModalOpen({ data: staleModalHistory });
    });

    // The stale modal-open result must NOT overwrite the authoritative refresh
    expect(store.getState().chat.messages).toEqual(freshPostSendHistory);
    expect(store.getState().chat.messages).not.toEqual(staleModalHistory);
  });
});
