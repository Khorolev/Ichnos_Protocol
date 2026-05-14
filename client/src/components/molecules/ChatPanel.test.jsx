import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";

import chatReducer from "../../features/chat/chatSlice";
import authReducer from "../../features/auth/authSlice";

const WELCOME_TEXT = "Hi — tell me about your battery program. I can help with EU 2023/1542, MS 2818, FMEA, mechanical design, or anything else.";
const DISCLAIMER_TEXT = "Responses are AI-generated. We follow up personally on every conversation that becomes a lead.";

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

function renderPanel(store, props) {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <ChatPanel {...props} />
      </MemoryRouter>
    </Provider>,
  );
}

let ChatPanel;
beforeEach(async () => {
  vi.clearAllMocks();
  mockSendStreamMessage.mockResolvedValue("completed");
  ({ default: ChatPanel } = await import("./ChatPanel"));
});

describe("ChatPanel UI contract", () => {
  it("renders the welcome bot bubble on first render", () => {
    const store = createStore();
    renderPanel(store, { mode: "inline", persistState: false });

    const welcome = screen.getByTestId("chat-bubble-bot");
    expect(welcome).toBeInTheDocument();
    expect(welcome).toHaveTextContent(WELCOME_TEXT);
  });

  it("renders the disclaimer text", () => {
    const store = createStore();
    renderPanel(store, { mode: "inline", persistState: false });

    const disclaimer = screen.getByTestId("chat-panel-disclaimer");
    expect(disclaimer).toBeInTheDocument();
    expect(disclaimer).toHaveTextContent(DISCLAIMER_TEXT);
  });

  it("disables the send button when input is empty", () => {
    const store = createStore();
    renderPanel(store, { mode: "inline", persistState: false });

    expect(screen.getByTestId("chat-send-btn")).toBeDisabled();
  });

  it("enables the send button once input has content", async () => {
    const user = userEvent.setup();
    const store = createStore();
    renderPanel(store, { mode: "inline", persistState: false });

    await user.type(screen.getByTestId("chat-input"), "Hello");
    expect(screen.getByTestId("chat-send-btn")).toBeEnabled();
  });

  it("renders a user bubble after sending a message", async () => {
    const user = userEvent.setup();
    const store = createStore();
    renderPanel(store, { mode: "inline", persistState: false });

    await user.type(screen.getByTestId("chat-input"), "My question");
    await user.click(screen.getByTestId("chat-send-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("chat-bubble-user")).toHaveTextContent("My question");
    });
  });

  it("applies the correct wrapper modifier class for mode=modal and mode=inline", () => {
    const inlineStore = createStore();
    const { unmount } = renderPanel(inlineStore, { mode: "inline", persistState: false });
    expect(screen.getByTestId("chat-panel")).toHaveClass("chat-panel--inline");
    expect(screen.getByTestId("chat-panel")).not.toHaveClass("chat-panel--modal");
    unmount();

    const modalStore = createStore();
    renderPanel(modalStore, { mode: "modal", persistState: true });
    expect(screen.getByTestId("chat-panel")).toHaveClass("chat-panel--modal");
    expect(screen.getByTestId("chat-panel")).not.toHaveClass("chat-panel--inline");
  });

  it("resets local conversation between mount cycles when persistState=false", async () => {
    const user = userEvent.setup();
    const store = createStore();
    const { unmount } = renderPanel(store, { mode: "inline", persistState: false });

    await user.type(screen.getByTestId("chat-input"), "Local message");
    await user.click(screen.getByTestId("chat-send-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("chat-bubble-user")).toHaveTextContent("Local message");
    });

    unmount();

    renderPanel(store, { mode: "inline", persistState: false });

    expect(screen.queryByTestId("chat-bubble-user")).not.toBeInTheDocument();
    const botBubbles = screen.getAllByTestId("chat-bubble-bot");
    expect(botBubbles).toHaveLength(1);
    expect(botBubbles[0]).toHaveTextContent(WELCOME_TEXT);
  });
});
