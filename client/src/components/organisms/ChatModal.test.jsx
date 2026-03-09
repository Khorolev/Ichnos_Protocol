import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

vi.mock("./AuthModal", () => ({
  default: function MockAuthModal({ isOpen, onSuccess, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="auth-modal">
        <button onClick={onSuccess}>Mock Auth Success</button>
        <button onClick={onClose}>Mock Auth Close</button>
      </div>
    );
  },
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

  it("opens auth modal for unauthenticated users when modal opens", async () => {
    const { default: ChatModal } = await import("./ChatModal");
    const store = createStore({ auth: { isAuthenticated: false, user: null } });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ChatModal />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByTestId("auth-modal")).toBeInTheDocument();
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
