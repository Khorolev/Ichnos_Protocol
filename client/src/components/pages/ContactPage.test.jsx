import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../../features/auth/authSlice";
import contactReducer from "../../features/contact/contactSlice";
import chatReducer from "../../features/chat/chatSlice";

const { mockOpenChatModal, mockOpenContactModal } = vi.hoisted(() => ({
  mockOpenChatModal: vi.fn(() => ({ type: "chat/openModal" })),
  mockOpenContactModal: vi.fn(() => ({ type: "contact/openModal" })),
}));

vi.mock("../../features/contact/contactApi", () => ({
  useGetMyRequestsQuery: vi.fn(() => ({ data: null, isLoading: false })),
  useSubmitContactMutation: () => [vi.fn(), {}],
  useAddQuestionMutation: () => [vi.fn(), {}],
  contactApi: {
    reducerPath: "contactApi",
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

vi.mock("../../features/chat/chatSlice", async () => {
  const actual = await vi.importActual("../../features/chat/chatSlice");
  return { ...actual, openModal: mockOpenChatModal };
});

vi.mock("../../features/contact/contactSlice", async () => {
  const actual = await vi.importActual("../../features/contact/contactSlice");
  return { ...actual, openModal: mockOpenContactModal };
});

vi.mock("../../config/firebase", () => ({
  auth: { currentUser: null },
}));

vi.mock("../organisms/ContactForm", () => ({
  default: function MockContactForm() {
    return <div data-testid="contact-form" />;
  },
}));

vi.mock("../organisms/CalendlyModal", () => ({
  default: function MockCalendlyModal({ isOpen }) {
    return isOpen ? <div data-testid="calendly-modal" /> : null;
  },
}));

vi.mock("../molecules/MyInquiriesList", () => ({
  default: function MockMyInquiriesList() {
    return <div data-testid="my-inquiries" />;
  },
}));

function createStore(overrides = {}) {
  return configureStore({
    reducer: { auth: authReducer, contact: contactReducer, chat: chatReducer },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: null,
        ...overrides.auth,
      },
      contact: {
        isOpen: false,
        requestId: null,
        formData: {},
        myRequests: [],
        submitting: false,
        error: null,
        ...overrides.contact,
      },
      chat: {
        messages: [],
        isOpen: false,
        loading: false,
        error: null,
        dailyCount: 0,
        ...overrides.chat,
      },
    },
  });
}

describe("ContactPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders hero heading for unauthenticated user", async () => {
    const { default: ContactPage } = await import("./ContactPage");
    const store = createStore();
    render(
      <Provider store={store}>
        <HelmetProvider>
          <MemoryRouter>
            <ContactPage />
          </MemoryRouter>
        </HelmetProvider>
      </Provider>,
    );

    expect(screen.getByText("Get in Touch")).toBeInTheDocument();
  });

  it("dispatches openChatModal when Start Chat is clicked", async () => {
    const user = userEvent.setup();
    const { default: ContactPage } = await import("./ContactPage");
    const store = createStore();
    render(
      <Provider store={store}>
        <HelmetProvider>
          <MemoryRouter>
            <ContactPage />
          </MemoryRouter>
        </HelmetProvider>
      </Provider>,
    );

    await user.click(screen.getByRole("button", { name: "Start Chat" }));
    expect(mockOpenChatModal).toHaveBeenCalled();
  });

  it("dispatches openContactModal when Submit Inquiry is clicked", async () => {
    const user = userEvent.setup();
    const { default: ContactPage } = await import("./ContactPage");
    const store = createStore();
    render(
      <Provider store={store}>
        <HelmetProvider>
          <MemoryRouter>
            <ContactPage />
          </MemoryRouter>
        </HelmetProvider>
      </Provider>,
    );

    await user.click(screen.getByRole("button", { name: "Submit Inquiry" }));
    expect(mockOpenContactModal).toHaveBeenCalled();
  });

  it("renders MyInquiriesList when authenticated user has requests", async () => {
    const { useGetMyRequestsQuery } =
      await import("../../features/contact/contactApi");
    useGetMyRequestsQuery.mockReturnValue({
      data: {
        data: [
          {
            id: "1",
            status: "new",
            questions: [{ text: "Q1" }],
            created_at: "2025-01-01",
          },
        ],
      },
      isLoading: false,
    });

    const { default: ContactPage } = await import("./ContactPage");
    const store = createStore({
      auth: { isAuthenticated: true, user: { uid: "u1" } },
    });
    render(
      <Provider store={store}>
        <HelmetProvider>
          <MemoryRouter>
            <ContactPage />
          </MemoryRouter>
        </HelmetProvider>
      </Provider>,
    );

    expect(screen.getByTestId("my-inquiries")).toBeInTheDocument();
  });

  it("does not render MyInquiriesList when authenticated user has no requests", async () => {
    const { useGetMyRequestsQuery } =
      await import("../../features/contact/contactApi");
    useGetMyRequestsQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });

    const { default: ContactPage } = await import("./ContactPage");
    const store = createStore({
      auth: { isAuthenticated: true, user: { uid: "u1" } },
    });
    render(
      <Provider store={store}>
        <HelmetProvider>
          <MemoryRouter>
            <ContactPage />
          </MemoryRouter>
        </HelmetProvider>
      </Provider>,
    );

    expect(screen.queryByTestId("my-inquiries")).not.toBeInTheDocument();
  });

  it("opens CalendlyModal when Book a Meeting is clicked", async () => {
    const user = userEvent.setup();
    const { default: ContactPage } = await import("./ContactPage");
    const store = createStore();
    render(
      <Provider store={store}>
        <HelmetProvider>
          <MemoryRouter>
            <ContactPage />
          </MemoryRouter>
        </HelmetProvider>
      </Provider>,
    );

    expect(screen.queryByTestId("calendly-modal")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Book a Meeting" }));
    expect(screen.getByTestId("calendly-modal")).toBeInTheDocument();
  });
});
