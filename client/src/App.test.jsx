import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor } from './test-utils';

import App from './App';

vi.mock('./hooks/useApiSanityCheck');
vi.mock('./routes/AdminRoute', () => ({
  default: ({ children }) => children,
}));
vi.mock('./components/pages/AdminPage', () => ({
  default: () => <div>Admin Page</div>,
}));
vi.mock('./components/pages/LandingPage', () => ({
  default: () => <div>Landing Page</div>,
}));
vi.mock('./components/pages/PassportPage', () => ({
  default: () => <div>Passport Page</div>,
}));
vi.mock('./components/templates/PublicLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

describe('App API sanity warning', () => {
  beforeEach(async () => {
    const mod = await import('./hooks/useApiSanityCheck');
    mod.useApiSanityCheck.mockReturnValue({
      warning: 'API routing is misconfigured',
      isChecking: false,
    });
  });

  it('shows warning on public route without blocking content', async () => {
    renderWithProviders(<App />, { route: '/' });

    await waitFor(() => {
      expect(
        screen.getByText('API routing is misconfigured'),
      ).toBeInTheDocument();
      expect(screen.getByText('Landing Page')).toBeInTheDocument();
    });
  });

  it('shows warning on /admin route without blocking content', async () => {
    renderWithProviders(<App />, { route: '/admin' });

    await waitFor(() => {
      expect(
        screen.getByText('API routing is misconfigured'),
      ).toBeInTheDocument();
      expect(screen.getByText('Admin Page')).toBeInTheDocument();
    });
  });

  it('does not show warning when API is healthy', async () => {
    const mod = await import('./hooks/useApiSanityCheck');
    mod.useApiSanityCheck.mockReturnValue({
      warning: null,
      isChecking: false,
    });

    renderWithProviders(<App />, { route: '/admin' });

    await waitFor(() => {
      expect(
        screen.queryByText('API Configuration Warning'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Admin Page')).toBeInTheDocument();
    });
  });

  it('renders landing page without warning when API is healthy', async () => {
    const mod = await import('./hooks/useApiSanityCheck');
    mod.useApiSanityCheck.mockReturnValue({
      warning: null,
      isChecking: false,
    });

    renderWithProviders(<App />, { route: '/' });

    await waitFor(() => {
      expect(
        screen.queryByText('API Configuration Warning'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Landing Page')).toBeInTheDocument();
    });
  });
});

describe('App route theme wrappers', () => {
  beforeEach(async () => {
    const mod = await import('./hooks/useApiSanityCheck');
    mod.useApiSanityCheck.mockReturnValue({
      warning: null,
      isChecking: false,
    });
  });

  it('renders advisory theme wrapper at /', async () => {
    const { container } = renderWithProviders(<App />, { route: '/' });

    await waitFor(() => {
      expect(screen.getByText('Landing Page')).toBeInTheDocument();
    });

    expect(container.querySelector('.theme-advisory')).toBeInTheDocument();
    expect(container.querySelector('.theme-passport')).toBeNull();
  });

  it('renders passport theme wrapper at /passport', async () => {
    const { container } = renderWithProviders(<App />, { route: '/passport' });

    await waitFor(() => {
      expect(screen.getByText('Passport Page')).toBeInTheDocument();
    });

    expect(container.querySelector('.theme-passport')).toBeInTheDocument();
    expect(container.querySelector('.theme-advisory')).toBeNull();
  });
});
