import { axe } from "vitest-axe";
import { renderWithProviders, screen, fireEvent } from "../../test-utils";
import MobileNavOverlay from "./MobileNavOverlay";
import { NAV_LINKS, LANDING_SECTIONS } from "../../constants/navigation";

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

  it("renders all NAV_LINKS as navigation links", () => {
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={vi.fn()} />);

    NAV_LINKS.forEach(({ label }) => {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    });
  });

  it("renders all LANDING_SECTIONS as section buttons", () => {
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={vi.fn()} />);

    LANDING_SECTIONS.forEach(({ label }) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
  });

  it("clicking section button calls onClose", () => {
    const onClose = vi.fn();
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={onClose} />);

    fireEvent.click(
      screen.getByRole("button", { name: LANDING_SECTIONS[0].label }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("clicking NavItem calls onClose", () => {
    const onClose = vi.fn();
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole("link", { name: "Services" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("close button is keyboard accessible", () => {
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={vi.fn()} />);

    const closeBtn = screen.getByRole("button", { name: /close menu/i });
    closeBtn.focus();
    expect(closeBtn).toHaveFocus();
  });

  it("all navigation links are keyboard accessible", () => {
    renderWithProviders(<MobileNavOverlay isOpen={true} onClose={vi.fn()} />);

    NAV_LINKS.forEach(({ label }) => {
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
