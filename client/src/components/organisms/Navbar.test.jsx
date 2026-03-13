import { axe } from 'vitest-axe';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, fireEvent } from '../../test-utils';
import Navbar from './Navbar';
import { NAV_LINKS, LANDING_SECTIONS } from '../../constants/navigation';

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => true),
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('../../config/firebase', () => ({
  auth: {},
}));

vi.mock('../../features/auth/authApi', () => ({
  useSyncProfileMutation: vi.fn(() => [
    vi.fn(() => ({ unwrap: () => Promise.resolve({ data: { user: {}, isAdmin: false } }) })),
    { isLoading: false },
  ]),
}));

const loggedOutState = {
  auth: {
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: false,
    error: null,
  },
};

const loggedInState = {
  auth: {
    user: { name: 'Jane', email: 'jane@test.com' },
    isAuthenticated: true,
    isAdmin: false,
    loading: false,
    error: null,
  },
};

describe('Navbar', () => {
  it('renders Logo component', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });
    const logoLink = screen.getByRole('link', { name: /ichnos/i });
    expect(logoLink).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });

    NAV_LINKS.forEach(({ label }) => {
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders Contact navigation item', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });

    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
  });

  it('renders Home link as a dropdown with LANDING_SECTIONS items', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });

    const homeButton = screen.getByRole('button', { name: /home/i });
    expect(homeButton).toBeInTheDocument();

    fireEvent.click(homeButton);

    LANDING_SECTIONS.forEach(({ label }) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });

  it('renders Services and Team as NavItem links', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });

    expect(screen.getByRole('link', { name: 'Services' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Team' })).toBeInTheDocument();
  });

  it('shows Login button when not authenticated', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });

    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('opens auth modal when Login button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('shows UserMenu when authenticated', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedInState,
    });

    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument();
  });

  it('renders mobile hamburger button with d-md-none class', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });

    const hamburger = screen.getByRole('button', { name: /open menu/i });
    expect(hamburger).toHaveClass('d-md-none');
  });

  it('calls onMenuToggle when hamburger is clicked', () => {
    const onMenuToggle = vi.fn();
    renderWithProviders(<Navbar onMenuToggle={onMenuToggle} />, {
      preloadedState: loggedOutState,
    });

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(onMenuToggle).toHaveBeenCalledOnce();
  });

  it('hamburger button has aria-label "Open menu"', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });

    const hamburger = screen.getByLabelText('Open menu');
    expect(hamburger).toBeInTheDocument();
  });

  it('desktop nav has d-none d-md-flex classes', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });

    const desktopNav = screen.getByRole('link', { name: 'Services' }).closest('.d-md-flex');
    expect(desktopNav).toHaveClass('d-none');
    expect(desktopNav).toHaveClass('d-md-flex');
  });

  it('hamburger button is keyboard accessible', () => {
    const onMenuToggle = vi.fn();
    renderWithProviders(<Navbar onMenuToggle={onMenuToggle} />, {
      preloadedState: loggedOutState,
    });

    const hamburger = screen.getByRole('button', { name: /open menu/i });
    hamburger.focus();
    expect(hamburger).toHaveFocus();
  });

  it('all navigation links are keyboard accessible', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });

    const servicesLink = screen.getByRole('link', { name: 'Services' });
    servicesLink.focus();
    expect(servicesLink).toHaveFocus();
  });

  it('marks the active nav link with the active class when route matches', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      route: '/services',
      preloadedState: loggedOutState,
    });

    const servicesLink = screen.getByRole('link', { name: 'Services' });
    expect(servicesLink).toHaveClass('active');

    const teamLink = screen.getByRole('link', { name: 'Team' });
    expect(teamLink).not.toHaveClass('active');
  });

  it('dropdown has aria-expanded attribute', () => {
    renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });

    const homeButton = screen.getByRole('button', { name: /home/i });
    expect(homeButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(homeButton);
    expect(homeButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Navbar onMenuToggle={vi.fn()} />, {
      preloadedState: loggedOutState,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
