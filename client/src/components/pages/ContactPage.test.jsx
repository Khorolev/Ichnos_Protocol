import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../../features/auth/authSlice";
import contactReducer from "../../features/contact/contactSlice";
import chatReducer from "../../features/chat/chatSlice";
import { CONTACT_META } from "../../constants/seoMeta";
import { PAGE_STRUCTURED_DATA } from "../../constants/structuredData";

const { mockOpenContactModal, mockContactSection } = vi.hoisted(() => ({
  mockOpenContactModal: vi.fn(() => ({ type: "contact/openModal" })),
  mockContactSection: vi.fn(() => <div data-testid="contact-section" />),
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

vi.mock("../../features/contact/contactSlice", async () => {
  const actual = await vi.importActual("../../features/contact/contactSlice");
  return { ...actual, openModal: mockOpenContactModal };
});

vi.mock("../../config/firebase", () => ({
  auth: { currentUser: null },
}));

vi.mock("../organisms/ContactSection", () => ({
  default: (props) => mockContactSection(props),
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

async function renderPage(storeOverrides = {}) {
  const { default: ContactPage } = await import("./ContactPage");
  const store = createStore(storeOverrides);
  return render(
    <Provider store={store}>
      <HelmetProvider>
        <MemoryRouter>
          <ContactPage />
        </MemoryRouter>
      </HelmetProvider>
    </Provider>,
  );
}

describe("ContactPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the shared ContactSection", async () => {
    await renderPage();
    expect(screen.getByTestId("contact-section")).toBeInTheDocument();
  });

  it("mounts shared ContactSection with persistChat=true", async () => {
    await renderPage();
    expect(mockContactSection).toHaveBeenCalledWith(
      expect.objectContaining({ persistChat: true }),
    );
    expect(mockContactSection).not.toHaveBeenCalledWith(
      expect.objectContaining({ showFullContactLink: true }),
    );
  });

  it("applies CONTACT_META to the document head via Helmet", async () => {
    await renderPage();
    await waitFor(() => expect(document.title).toBe(CONTACT_META.title));
    expect(
      document.querySelector('meta[name="description"][data-rh="true"]'),
    ).toHaveAttribute("content", CONTACT_META.description);
    expect(
      document.querySelector('meta[name="keywords"][data-rh="true"]'),
    ).toHaveAttribute("content", CONTACT_META.keywords);
    expect(
      document.querySelector('link[rel="canonical"][data-rh="true"]'),
    ).toHaveAttribute("href", CONTACT_META.canonical);
  });

  it("applies CONTACT_META og tags via Helmet", async () => {
    await renderPage();
    await waitFor(() => {
      expect(
        document.querySelector('meta[property="og:title"][data-rh="true"]'),
      ).toHaveAttribute("content", CONTACT_META.og.title);
      expect(
        document.querySelector(
          'meta[property="og:description"][data-rh="true"]',
        ),
      ).toHaveAttribute("content", CONTACT_META.og.description);
      expect(
        document.querySelector('meta[property="og:type"][data-rh="true"]'),
      ).toHaveAttribute("content", CONTACT_META.og.type);
      expect(
        document.querySelector('meta[property="og:url"][data-rh="true"]'),
      ).toHaveAttribute("content", CONTACT_META.og.url);
      expect(
        document.querySelector('meta[property="og:site_name"][data-rh="true"]'),
      ).toHaveAttribute("content", CONTACT_META.og.siteName);
      expect(
        document.querySelector('meta[property="og:locale"][data-rh="true"]'),
      ).toHaveAttribute("content", CONTACT_META.og.locale);
      expect(
        document.querySelector('meta[property="og:image"][data-rh="true"]'),
      ).toHaveAttribute("content", CONTACT_META.og.image);
      expect(
        document.querySelector('meta[property="og:image:alt"][data-rh="true"]'),
      ).toHaveAttribute("content", CONTACT_META.og.imageAlt);
    });
  });

  it("applies CONTACT_META twitter tags via Helmet", async () => {
    await renderPage();
    await waitFor(() => {
      expect(
        document.querySelector('meta[name="twitter:card"][data-rh="true"]'),
      ).toHaveAttribute("content", CONTACT_META.twitter.card);
      expect(
        document.querySelector('meta[name="twitter:title"][data-rh="true"]'),
      ).toHaveAttribute("content", CONTACT_META.twitter.title);
      expect(
        document.querySelector(
          'meta[name="twitter:description"][data-rh="true"]',
        ),
      ).toHaveAttribute("content", CONTACT_META.twitter.description);
      expect(
        document.querySelector('meta[name="twitter:image"][data-rh="true"]'),
      ).toHaveAttribute("content", CONTACT_META.twitter.image);
      expect(
        document.querySelector(
          'meta[name="twitter:image:alt"][data-rh="true"]',
        ),
      ).toHaveAttribute("content", CONTACT_META.twitter.imageAlt);
    });
  });

  it("emits JSON-LD schemas from PAGE_STRUCTURED_DATA.contact", async () => {
    await renderPage();
    await waitFor(() => {
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"][data-rh="true"]',
      );
      expect(scripts.length).toBe(PAGE_STRUCTURED_DATA.contact.length);
      expect(JSON.parse(scripts[0].textContent)).toEqual(
        PAGE_STRUCTURED_DATA.contact[0],
      );
    });
  });

  it("renders the intro paragraph above the contact section", async () => {
    await renderPage();
    expect(screen.getByText(/About contacting us/)).toBeInTheDocument();
  });

  it("renders exactly one h1 page-level heading", async () => {
    await renderPage();
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Contact Ichnos Protocol");
  });

  it("renders the intro paragraph above the shared ContactSection", async () => {
    await renderPage();
    const intro = screen.getByText(/About contacting us/);
    const contactSection = screen.getByTestId("contact-section");
    expect(intro).toBeInTheDocument();
    expect(contactSection).toBeInTheDocument();
    const order = intro.compareDocumentPosition(contactSection);
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("opens ContactForm via openContactModal when 'Submit a detailed inquiry' is clicked", async () => {
    await renderPage();
    const inquiryButton = screen.getByRole("button", {
      name: /submit a detailed inquiry/i,
    });
    fireEvent.click(inquiryButton);
    expect(mockOpenContactModal).toHaveBeenCalled();
    expect(screen.getByTestId("contact-form")).toBeInTheDocument();
  });

  it("opens CalendlyModal when the scheduler action is clicked", async () => {
    await renderPage();
    expect(screen.queryByTestId("calendly-modal")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /schedule a call/i }));
    expect(screen.getByTestId("calendly-modal")).toBeInTheDocument();
  });

  it("no longer renders the legacy modal-CTA buttons", async () => {
    await renderPage();
    expect(
      screen.queryByRole("button", { name: "Start Chat" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit Inquiry" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Book a Meeting" }),
    ).not.toBeInTheDocument();
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

    await renderPage({ auth: { isAuthenticated: true, user: { uid: "u1" } } });
    expect(screen.getByTestId("my-inquiries")).toBeInTheDocument();
  });

  it("does not render MyInquiriesList when authenticated user has no requests", async () => {
    const { useGetMyRequestsQuery } =
      await import("../../features/contact/contactApi");
    useGetMyRequestsQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });

    await renderPage({ auth: { isAuthenticated: true, user: { uid: "u1" } } });
    expect(screen.queryByTestId("my-inquiries")).not.toBeInTheDocument();
  });
});
