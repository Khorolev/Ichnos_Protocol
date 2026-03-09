import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../../features/auth/authSlice';

const mockTriggerDownload = vi.fn();
const mockDeleteAccount = vi.fn();
const mockSignOut = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../features/gdpr/gdprApi', () => ({
  useLazyDownloadDataQuery: vi.fn(() => [
    mockTriggerDownload,
    { isFetching: false },
  ]),
  useDeleteAccountMutation: vi.fn(() => [
    mockDeleteAccount,
    { isLoading: false },
  ]),
  gdprApi: {
    reducerPath: 'gdprApi',
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

vi.mock('firebase/auth', () => ({
  signOut: (...args) => mockSignOut(...args),
  getAuth: vi.fn(() => ({})),
}));

vi.mock('../../config/firebase', () => ({
  auth: {},
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../organisms/DeleteAccountModal', () => ({
  default: function MockDeleteAccountModal({ show, onClose, onConfirm, isLoading }) {
    return show ? (
      <div data-testid="delete-modal">
        <button data-testid="modal-close" onClick={onClose}>Close</button>
        <button data-testid="modal-confirm" onClick={onConfirm} disabled={isLoading}>
          Confirm
        </button>
      </div>
    ) : null;
  },
}));

function createStore(overrides = {}) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: { uid: 'u1', email: 'a@b.com' },
        isAuthenticated: true,
        isAdmin: false,
        loading: false,
        error: null,
        ...overrides.auth,
      },
    },
  });
}

function renderPage(overrides = {}) {
  const store = createStore(overrides);
  return render(
    <Provider store={store}>
      <HelmetProvider>
        <MemoryRouter initialEntries={['/privacy']}>
          <PrivacyPage />
        </MemoryRouter>
      </HelmetProvider>
    </Provider>,
  );
}

let PrivacyPage;

describe('PrivacyPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockTriggerDownload.mockResolvedValue({ data: { email: 'a@b.com' } });
    mockDeleteAccount.mockReturnValue({ unwrap: () => Promise.resolve() });
    mockSignOut.mockResolvedValue();
    ({ default: PrivacyPage } = await import('./PrivacyPage'));
  });

  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Privacy & Data Management')).toBeInTheDocument();
  });

  it('renders Privacy Policy section', () => {
    renderPage();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText(/do not sell or share your data/)).toBeInTheDocument();
  });

  it('renders Cookie Policy section', () => {
    renderPage();
    expect(screen.getByText('Cookie Policy')).toBeInTheDocument();
    expect(screen.getByText(/strictly necessary cookies/)).toBeInTheDocument();
  });

  it('renders Download My Data button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Download My Data' })).toBeInTheDocument();
  });

  it('renders Delete My Account button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Delete My Account' })).toBeInTheDocument();
  });

  it('calls triggerDownload when Download My Data is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Download My Data' }));

    expect(mockTriggerDownload).toHaveBeenCalledOnce();
  });

  it('shows download success alert after download', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Download My Data' }));

    await waitFor(() => {
      expect(screen.getByText('Your data has been downloaded.')).toBeInTheDocument();
    });
  });

  it('opens modal when Delete My Account is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete My Account' }));
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
  });

  it('closes modal when onClose is called', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete My Account' }));
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();

    await user.click(screen.getByTestId('modal-close'));
    expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
  });

  it('calls deleteAccount, signOut, and navigates on confirm', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete My Account' }));
    await user.click(screen.getByTestId('modal-confirm'));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledOnce();
      expect(mockSignOut).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('still navigates home when signOut fails after successful deletion', async () => {
    mockSignOut.mockRejectedValueOnce(new Error('signOut failed'));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete My Account' }));
    await user.click(screen.getByTestId('modal-confirm'));

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
