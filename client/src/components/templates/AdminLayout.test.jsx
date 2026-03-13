import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockSignOut = vi.fn();

vi.mock('firebase/auth', () => ({
  signOut: (...args) => mockSignOut(...args),
}));

vi.mock('../../config/firebase', () => ({
  auth: { currentUser: null },
}));

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children content', async () => {
    const { default: AdminLayout } = await import('./AdminLayout');
    render(<AdminLayout><p>Child content</p></AdminLayout>);
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('shows Ichnos Admin heading', async () => {
    const { default: AdminLayout } = await import('./AdminLayout');
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByText('Ichnos Admin')).toBeInTheDocument();
  });

  it('shows Admin badge', async () => {
    const { default: AdminLayout } = await import('./AdminLayout');
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('shows logout button', async () => {
    const { default: AdminLayout } = await import('./AdminLayout');
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('calls signOut when logout is clicked', async () => {
    const user = userEvent.setup();
    const { default: AdminLayout } = await import('./AdminLayout');
    render(<AdminLayout><div /></AdminLayout>);

    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(mockSignOut).toHaveBeenCalled();
  });
});
