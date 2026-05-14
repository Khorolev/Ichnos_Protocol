import { axe } from "vitest-axe";
import { renderWithProviders, screen, fireEvent } from "../../test-utils";
import MobileNavOverlay from "./MobileNavOverlay";
import { NAV_ITEMS } from "../../constants/navigation";

// Mobile overlay renders flat NAV_ITEMS as links; dropdown items (Company)
// expand to a section label + child links inline. These helpers reflect that.
const FLAT_NAV_ITEMS = NAV_ITEMS.filter((item) => !item.children);
const COMPANY_ITEM = NAV_ITEMS.find((item) => item.label === "Company");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
}));

vi.mock("../../config/firebase", () => ({
  auth: {},
}));

vi.mock("../../features/auth/authApi", () => ({
  useSyncProfileMutation: vi.fn(() => [
    vi.fn(() => ({
      unwrap: () => Promise.resolve({ data: { user: {}, isAdmin: false } }),
    })),
    { isLoading: false },
  ]),
}));

vi.mock("../../hooks/useReducedMotion", () => ({
  useReducedMotion: vi.fn(() => true),
}));

describe("MobileNavOverlay", () => {
  it("has mobile-nav-overlay--open class when isOpen is true", () => {
    const { container } = renderWithProviders(
      <MobileNavOverlay isOpen={true} onClose={vi.fn()} />,
    );
    const overlay = container.querySelector(".mobile-nav-overlay");
    expect(overlay).toHaveClass("mobile-nav-overlay--open");
  });

  it("has mobile-nav-overlay--closed class when isOpen is false", () => {
    const { container } = renderWithProviders(
      <MobileNavOverlay isOpen={false} onClose={vi.fn()} />,
    );
    const overlay = container.querySelector(".mobile-nav-overlay");
    expect(overlay).toHaveClass("mobile-nav-overlay--closed");
  });

  it("close button calls onClose when clicked", () => {
    const onClose = vi.fn();
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close menu/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('close button has aria-label "Close menu"', () => {
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();
  });

  it("close button is keyboard accessible", () => {
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={vi.fn()} />);

    const closeBtn = screen.getByRole("button", { name: /close menu/i });
    closeBtn.focus();
    expect(closeBtn).toHaveFocus();
  });

  it("renders flat NAV_ITEMS as links and Company children (Why Ichnos, Team) as nested links", () => {
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={vi.fn()} />);

    // Flat items: Services, Battery Passport, Contact — each is a direct link.
    FLAT_NAV_ITEMS.forEach((item) => {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toHaveAttribute("href", item.path);
    });

    // Company appears as a non-link section label; its children render as links.
    expect(screen.queryByRole("link", { name: "Company" })).toBeNull();
    COMPANY_ITEM.children.forEach((child) => {
      expect(screen.getByRole("link", { name: child.label })).toBeInTheDocument();
    });
  });

  it("clicking any flat NAV_ITEMS entry or any Company child calls onClose", () => {
    const allClickableLabels = [
      ...FLAT_NAV_ITEMS.map((item) => item.label),
      ...COMPANY_ITEM.children.map((child) => child.label),
    ];

    allClickableLabels.forEach((label) => {
      const onClose = vi.fn();
      const { unmount } = renderWithProviders(
        <MobileNavOverlay isOpen={true} onClose={onClose} />,
      );

      fireEvent.click(screen.getByRole("link", { name: label }));
      expect(onClose).toHaveBeenCalled();
      unmount();
    });
  });

  it("on / homepage, clicking Company/Services/Contact calls navigate with scrollTo state", () => {
    NAV_ITEMS.filter((item) => item.sectionId).forEach((item) => {
      mockNavigate.mockClear();
      const { unmount } = renderWithProviders(
        <MobileNavOverlay isOpen={true} onClose={vi.fn()} />,
        { route: "/" },
      );

      fireEvent.click(screen.getByRole("link", { name: item.label }));
      expect(mockNavigate).toHaveBeenCalledWith("/", {
        state: { scrollTo: item.sectionId },
      });
      unmount();
    });
  });

  it("on / homepage, clicking Battery Passport navigates to /passport", () => {
    mockNavigate.mockClear();
    renderWithProviders(
      <MobileNavOverlay isOpen={true} onClose={vi.fn()} />,
      { route: "/" },
    );

    fireEvent.click(screen.getByRole("link", { name: "Battery Passport" }));
    expect(mockNavigate).toHaveBeenCalledWith("/passport");
  });

  it("on /services route, clicking flat links and Company.Team navigates to their paths", () => {
    const expected = {
      Team: "/team",
      Services: "/services",
      Contact: "/contact",
    };

    Object.entries(expected).forEach(([label, path]) => {
      mockNavigate.mockClear();
      const { unmount } = renderWithProviders(
        <MobileNavOverlay isOpen={true} onClose={vi.fn()} />,
        { route: "/services" },
      );

      fireEvent.click(screen.getByRole("link", { name: label }));
      expect(mockNavigate).toHaveBeenCalledWith(path);
      unmount();
    });
  });

  it("on /services route, Battery Passport still navigates to /passport", () => {
    mockNavigate.mockClear();
    renderWithProviders(
      <MobileNavOverlay isOpen={true} onClose={vi.fn()} />,
      { route: "/services" },
    );

    fireEvent.click(screen.getByRole("link", { name: "Battery Passport" }));
    expect(mockNavigate).toHaveBeenCalledWith("/passport");
  });

  it("renders nav links with default token-aware classes on non-matching route", () => {
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={vi.fn()} />, {
      route: "/",
    });

    FLAT_NAV_ITEMS.forEach(({ label }) => {
      const link = screen.getByRole("link", { name: label });
      expect(link).toHaveClass("nav-link");
      expect(link).toHaveClass("mobile-nav-link-item");
      expect(link).toHaveClass("px-3");
      expect(link).toHaveClass("py-2");
      expect(link).toHaveClass("nav-link-default");
      expect(link).not.toHaveClass("active");
      expect(link).not.toHaveClass("nav-link-active");
    });
  });

  it("marks the active link with active/nav-link-active classes when the route matches", () => {
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={vi.fn()} />, {
      route: "/services",
    });

    const servicesLink = screen.getByRole("link", { name: "Services" });
    expect(servicesLink).toHaveClass("active");
    expect(servicesLink).toHaveClass("nav-link-active");
    expect(servicesLink).toHaveClass("px-3");
    expect(servicesLink).toHaveClass("py-2");
    expect(servicesLink).not.toHaveClass("nav-link-default");

    ["Battery Passport", "Contact"].forEach((label) => {
      const link = screen.getByRole("link", { name: label });
      expect(link).toHaveClass("nav-link-default");
      expect(link).not.toHaveClass("active");
    });
    // Company section: children render as flat links; none should be active here.
    COMPANY_ITEM.children.forEach((child) => {
      const link = screen.getByRole("link", { name: child.label });
      expect(link).not.toHaveClass("active");
    });
  });

  it("on /team route, the Team child link inside Company section is marked active", () => {
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={vi.fn()} />, {
      route: "/team",
    });
    expect(screen.getByRole("link", { name: "Team" })).toHaveClass("active");
  });

  it("all navigation links are keyboard accessible (flat items + Company children)", () => {
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={vi.fn()} />);

    const allLabels = [
      ...FLAT_NAV_ITEMS.map((item) => item.label),
      ...COMPANY_ITEM.children.map((child) => child.label),
    ];
    allLabels.forEach((label) => {
      const link = screen.getByRole("link", { name: label });
      link.focus();
      expect(link).toHaveFocus();
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithProviders(
      <MobileNavOverlay isOpen={true} onClose={vi.fn()} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
