import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

import { renderWithProviders, screen, waitFor } from '../../test-utils';
import UserMenu from './UserMenu';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('firebase/auth', () => ({
  signOut: vi.fn(() => Promise.resolve()),
  getAuth: vi.fn(() => ({})),
}));

vi.mock('../../config/firebase', () => ({
  auth: {},
}));

const { signOut } = await import('firebase/auth');

const authState = (overrides = {}) => ({
  auth: {
    user: { name: 'John', email: 'john@test.com' },
    isAuthenticated: true,
    isAdmin: false,
    loading: false,
    error: null,
    ...overrides,
  },
});

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user initial and name', () => {
    renderWithProviders(<UserMenu />, {
      preloadedState: authState(),
    });

    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('shows menu items for regular user', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserMenu />, {
      preloadedState: authState(),
    });

    await user.click(screen.getByText('John'));

    expect(screen.getByText('My Inquiry Status')).toBeInTheDocument();
    expect(screen.getByText('My Data')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('shows Admin Panel when user is admin', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserMenu />, {
      preloadedState: authState({ isAdmin: true }),
    });

    await user.click(screen.getByText('John'));

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('navigates to /contact on My Inquiry Status click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserMenu />, {
      preloadedState: authState(),
    });

    await user.click(screen.getByText('John'));
    await user.click(screen.getByText('My Inquiry Status'));

    expect(mockNavigate).toHaveBeenCalledWith('/contact');
  });

  it('navigates to /privacy on My Data click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserMenu />, {
      preloadedState: authState(),
    });

    await user.click(screen.getByText('John'));
    await user.click(screen.getByText('My Data'));

    expect(mockNavigate).toHaveBeenCalledWith('/privacy');
  });

  it('calls signOut and navigates home on logout', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserMenu />, {
      preloadedState: authState(),
    });

    await user.click(screen.getByText('John'));
    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
