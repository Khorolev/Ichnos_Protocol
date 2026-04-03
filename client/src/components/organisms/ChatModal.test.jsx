import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";

import chatReducer from "../../features/chat/chatSlice";
import authReducer from "../../features/auth/authSlice";

const mockUnwrap = vi.fn();

vi.mock("../../features/chat/chatApi", () => ({
  useSendMessageMutation: () => [
    () => ({ unwrap: mockUnwrap }),
    { isLoading: false },
  ],
  useGetHistoryQuery: () => ({ data: null }),
  chatApi: {
    reducerPath: "chatApi",
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

vi.mock("../../helpers/chatMessageMapper", () => ({
  mapHistoryToMessages: vi.fn(() => []),
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

  it("dispatches user message and AI reply from result.data on send success", async () => {
    const user = userEvent.setup();
    mockUnwrap.mockResolvedValue({
      data: { answer: "AI response", dailyCount: 1 },
      message: "Message sent",
      error: null,
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
      const state = store.getState().chat;
      expect(state.messages).toHaveLength(2);
      expect(state.messages[0].content).toBe("Test question");
      expect(state.messages[1].content).toBe("AI response");
      expect(state.dailyCount).toBe(1);
    });
  });

  it("does not add AI message when answer is missing", async () => {
    const user = userEvent.setup();
    mockUnwrap.mockResolvedValue({
      data: { answer: null, dailyCount: 1 },
      message: "Message sent",
      error: null,
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
    await user.type(textarea, "Test");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      const msgs = store.getState().chat.messages;
      expect(msgs).toHaveLength(1);
      expect(msgs[0].role).toBe("user");
    });
  });

  it("shows rate limit alert on 429 error", async () => {
    const user = userEvent.setup();
    mockUnwrap.mockRejectedValue({ status: 429 });

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
    await user.type(textarea, "Test");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(
        screen.getByText(/reached your daily message limit/i),
      ).toBeInTheDocument();
    });
  });

  it("shows AI unavailable alert with contact CTA on 503 error", async () => {
    const user = userEvent.setup();
    mockUnwrap.mockRejectedValue({ status: 503 });

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
    await user.type(textarea, "Test");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /leave your question/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows generic error on unknown error status", async () => {
    const user = userEvent.setup();
    mockUnwrap.mockRejectedValue({ status: 500 });

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
    await user.type(textarea, "Test");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
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
    mockUnwrap.mockResolvedValue({
      data: { answer: "AI response", dailyCount: 1 },
    });

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
      expect(mockUnwrap).not.toHaveBeenCalled();
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
});
