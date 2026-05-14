import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import authReducer, {
  forceCloseAuthModal,
  openAuthModal as openAuthModalAction,
} from '../../features/auth/authSlice';
import AuthModal from './AuthModal';

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  getAuth: vi.fn(() => ({})),
}));

const modalPropsSpy = vi.fn();
vi.mock('react-bootstrap/Modal', async () => {
  const ActualModule = await vi.importActual('react-bootstrap/Modal');
  const ActualModal = ActualModule.default;
  function SpiedModal(props) {
    modalPropsSpy(props);
    return <ActualModal {...props} />;
  }
  SpiedModal.Header = ActualModal.Header;
  SpiedModal.Body = ActualModal.Body;
  SpiedModal.Title = ActualModal.Title;
  SpiedModal.Footer = ActualModal.Footer;
  return { default: SpiedModal };
});

const mockFirebaseAuth = vi.hoisted(() => ({ currentUser: null }));
vi.mock('../../config/firebase', () => ({
  auth: mockFirebaseAuth,
}));

const mockSyncProfile = vi.fn(() => ({
  unwrap: () =>
    Promise.resolve({
      data: {
        user: {},
        isAdmin: false,
        profileState: { isProfileComplete: true, missingRequiredFields: [] },
      },
    }),
}));

vi.mock('../../features/auth/authApi', () => ({
  useSyncProfileMutation: vi.fn(() => [mockSyncProfile, { isLoading: false }]),
}));

const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } =
  await import('firebase/auth');

function createStore(overrides = {}) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: null,
        modalMode: null,
        profileState: null,
        authSuccess: false,
        enforcedLogout: false,
        ...overrides,
      },
    },
  });
}

function renderModal(authOverrides = {}) {
  const store = createStore(authOverrides);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <AuthModal />
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

function getSubmitButton(name) {
  const buttons = screen.getAllByRole('button', { name });
  return buttons.find((btn) => btn.getAttribute('type') === 'submit');
}

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFirebaseAuth.currentUser = null;
    mockSyncProfile.mockImplementation(() => ({
      unwrap: () =>
        Promise.resolve({
          data: {
            user: {},
            isAdmin: false,
            profileState: {
              isProfileComplete: true,
              missingRequiredFields: [],
            },
          },
        }),
    }));
  });

  it('renders login form when modalMode is login', () => {
    renderModal({ modalMode: 'login' });

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(getSubmitButton('Login')).toBeInTheDocument();
  });

  it('switches to signup form when Sign Up tab clicked', async () => {
    const user = userEvent.setup();
    renderModal({ modalMode: 'login' });

    await user.click(screen.getByText('Sign Up'));

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Surname')).toBeInTheDocument();
  });

  it('calls signInWithEmailAndPassword on login submit', async () => {
    const user = userEvent.setup();
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: '123', email: 'a@b.com', getIdToken: () => 'tok' },
    });

    renderModal({ modalMode: 'login' });

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'pass123');
    await user.click(getSubmitButton('Login'));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledOnce();
    });
  });

  it('calls createUserWithEmailAndPassword on signup submit', async () => {
    const user = userEvent.setup();
    createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: '456', email: 'new@b.com', getIdToken: () => 'tok' },
    });

    renderModal({ modalMode: 'signup' });

    await user.type(screen.getByLabelText('Name'), 'John');
    await user.type(screen.getByLabelText('Surname'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'new@b.com');
    await user.type(screen.getByLabelText('Password'), 'pass123');
    await user.click(getSubmitButton('Sign Up'));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledOnce();
    });
  });

  it('displays error message on Firebase auth failure', async () => {
    const user = userEvent.setup();
    signInWithEmailAndPassword.mockRejectedValue({
      code: 'auth/invalid-credential',
    });

    renderModal({ modalMode: 'login' });

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(getSubmitButton('Login'));

    await waitFor(() => {
      expect(
        screen.getByText('Invalid email or password.'),
      ).toBeInTheDocument();
    });
  });

  it('does not render when modalMode is null', () => {
    const { container } = render(
      <Provider store={createStore({ modalMode: null })}>
        <MemoryRouter>
          <AuthModal />
        </MemoryRouter>
      </Provider>,
    );

    expect(container.querySelector('.modal')).not.toBeInTheDocument();
  });

  describe('completion mode', () => {
    it('passes backdrop="static" and keyboard={false} to Modal', () => {
      modalPropsSpy.mockClear();
      renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
      });

      const shownCalls = modalPropsSpy.mock.calls.filter(
        ([p]) => p.show === true,
      );
      expect(shownCalls.length).toBeGreaterThan(0);
      expect(shownCalls[shownCalls.length - 1][0]).toMatchObject({
        backdrop: 'static',
        keyboard: false,
      });
    });

    it('does not pass backdrop="static" to login/signup Modal', () => {
      modalPropsSpy.mockClear();
      renderModal({ modalMode: 'login' });

      const shownCalls = modalPropsSpy.mock.calls.filter(
        ([p]) => p.show === true,
      );
      expect(shownCalls.length).toBeGreaterThan(0);
      const lastProps = shownCalls[shownCalls.length - 1][0];
      expect(lastProps.backdrop).not.toBe('static');
      expect(lastProps.keyboard).not.toBe(false);
    });

    it('renders completion title and warning', () => {
      renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
      });

      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
      expect(
        screen.getByText('Please complete your profile before continuing.'),
      ).toBeInTheDocument();
    });

    it('shows Name, Surname, and disabled Email fields', () => {
      renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
      });

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Surname')).toBeInTheDocument();
      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toBeDisabled();
      expect(emailInput).toHaveValue('test@test.com');
    });

    it('has close button disabled', () => {
      renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
      });

      const closeBtn = screen.getByLabelText('Close');
      expect(closeBtn).toBeDisabled();
    });

    it('shows Continue and Logout buttons', () => {
      renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
      });

      expect(getSubmitButton('Continue')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Logout' }),
      ).toBeInTheDocument();
    });

    it('logout dispatches logout and forceCloseAuthModal', async () => {
      const user = userEvent.setup();
      signOut.mockResolvedValue();
      const store = renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
      });

      await user.click(screen.getByRole('button', { name: 'Logout' }));

      await waitFor(() => {
        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(false);
        expect(state.modalMode).toBeNull();
        expect(state.enforcedLogout).toBe(true);
      });
    });

    it('logout closes modal immediately even when signOut never resolves', async () => {
      const user = userEvent.setup();
      signOut.mockReturnValue(new Promise(() => {}));
      const store = renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
      });

      await user.click(screen.getByRole('button', { name: 'Logout' }));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.modalMode).toBeNull();
      expect(state.enforcedLogout).toBe(true);
      expect(state.authSuccess).toBe(false);
    });

    it('logout still cleans up when signOut rejects', async () => {
      const user = userEvent.setup();
      signOut.mockRejectedValue(new Error('network error'));
      const store = renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
      });

      await user.click(screen.getByRole('button', { name: 'Logout' }));

      await waitFor(() => {
        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(false);
        expect(state.modalMode).toBeNull();
        expect(state.enforcedLogout).toBe(true);
        expect(state.authSuccess).toBe(false);
      });
    });

    it('successful completion closes modal when profile becomes complete', async () => {
      const user = userEvent.setup();
      mockSyncProfile.mockImplementation(() => ({
        unwrap: () =>
          Promise.resolve({
            data: {
              user: { uid: 'u1', email: 'test@test.com', name: 'John', surname: 'Doe' },
              isAdmin: false,
              profileState: {
                isProfileComplete: true,
                missingRequiredFields: [],
              },
            },
          }),
      }));

      const store = renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
      });

      await user.type(screen.getByLabelText('Name'), 'John');
      await user.type(screen.getByLabelText('Surname'), 'Doe');
      await user.click(getSubmitButton('Continue'));

      await waitFor(() => {
        expect(store.getState().auth.modalMode).toBeNull();
      });
    });

    it('does not close modal when Escape is pressed', async () => {
      const user = userEvent.setup();
      const store = renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
      });

      await user.keyboard('{Escape}');

      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
      expect(store.getState().auth.modalMode).toBe('complete-profile');
    });

    it('does not close modal when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const store = renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
      });

      const modal = document.querySelector('.modal');
      await user.click(modal);

      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
      expect(store.getState().auth.modalMode).toBe('complete-profile');
    });

    it('failed completion keeps modal open with error', async () => {
      const user = userEvent.setup();
      mockSyncProfile.mockImplementation(() => ({
        unwrap: () => Promise.reject({ status: 'FETCH_ERROR' }),
      }));

      renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
      });

      await user.type(screen.getByLabelText('Name'), 'John');
      await user.type(screen.getByLabelText('Surname'), 'Doe');
      await user.click(getSubmitButton('Continue'));

      await waitFor(() => {
        expect(
          screen.getByText('Unable to reach the server. Please try again.'),
        ).toBeInTheDocument();
      });
      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    });
  });

  describe('tab synchronization from modalMode', () => {
    it('renders signup form immediately when modalMode is signup', () => {
      renderModal({ modalMode: 'signup' });

      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Surname')).toBeInTheDocument();
      expect(getSubmitButton('Sign Up')).toBeInTheDocument();
    });

    it('reopens on login tab after a previous signup interaction', async () => {
      const store = createStore({ modalMode: 'signup' });

      const { unmount } = render(
        <Provider store={store}>
          <MemoryRouter>
            <AuthModal />
          </MemoryRouter>
        </Provider>,
      );

      expect(screen.getByText('Create Account')).toBeInTheDocument();

      // Close modal
      act(() => {
        store.dispatch(forceCloseAuthModal());
      });
      unmount();

      // Reopen with login intent
      act(() => {
        store.dispatch(openAuthModalAction('login'));
      });
      render(
        <Provider store={store}>
          <MemoryRouter>
            <AuthModal />
          </MemoryRouter>
        </Provider>,
      );

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(getSubmitButton('Login')).toBeInTheDocument();
    });
  });

  describe('sync error handling', () => {
    it('shows sync error on login when server is unreachable', async () => {
      const user = userEvent.setup();
      signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: '123', email: 'a@b.com' },
      });
      mockSyncProfile.mockImplementation(() => ({
        unwrap: () => Promise.reject({ status: 'FETCH_ERROR' }),
      }));

      renderModal({ modalMode: 'login' });

      await user.type(screen.getByLabelText('Email'), 'a@b.com');
      await user.type(screen.getByLabelText('Password'), 'pass123');
      await user.click(getSubmitButton('Login'));

      await waitFor(() => {
        expect(
          screen.getByText('Unable to reach the server. Please try again.'),
        ).toBeInTheDocument();
      });
    });

    it('shows sync error on signup when server is unreachable', async () => {
      const user = userEvent.setup();
      createUserWithEmailAndPassword.mockResolvedValue({
        user: { uid: '456', email: 'new@b.com' },
      });
      mockSyncProfile.mockImplementation(() => ({
        unwrap: () => Promise.reject({ status: 'TIMEOUT_ERROR' }),
      }));

      renderModal({ modalMode: 'signup' });

      await user.type(screen.getByLabelText('Name'), 'John');
      await user.type(screen.getByLabelText('Surname'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'new@b.com');
      await user.type(screen.getByLabelText('Password'), 'pass123');
      await user.click(getSubmitButton('Sign Up'));

      await waitFor(() => {
        expect(
          screen.getByText('Unable to reach the server. Please try again.'),
        ).toBeInTheDocument();
      });
    });

    it('shows Firebase error on login when credentials are wrong', async () => {
      const user = userEvent.setup();
      signInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/invalid-credential',
      });

      renderModal({ modalMode: 'login' });

      await user.type(screen.getByLabelText('Email'), 'a@b.com');
      await user.type(screen.getByLabelText('Password'), 'wrong');
      await user.click(getSubmitButton('Login'));

      await waitFor(() => {
        expect(
          screen.getByText('Invalid email or password.'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('completion mode canonical email', () => {
    it('shows canonical Firebase email over Redux email', () => {
      mockFirebaseAuth.currentUser = { email: 'canonical@firebase.com' };
      renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'stale@redux.com' },
        isAuthenticated: true,
      });

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveValue('canonical@firebase.com');
    });

    it('falls back to Redux email when Firebase user is null', () => {
      mockFirebaseAuth.currentUser = null;
      renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1', email: 'redux@test.com' },
        isAuthenticated: true,
      });

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveValue('redux@test.com');
    });

    it('is empty when both sources are unavailable', () => {
      mockFirebaseAuth.currentUser = null;
      renderModal({
        modalMode: 'complete-profile',
        user: { uid: 'u1' },
        isAuthenticated: true,
      });

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveValue('');
    });
  });

  describe('login with incomplete profile', () => {
    it('switches to complete-profile mode after login', async () => {
      const user = userEvent.setup();
      signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: '123', email: 'a@b.com' },
      });
      mockSyncProfile.mockImplementation(() => ({
        unwrap: () =>
          Promise.resolve({
            data: {
              user: { uid: '123', email: 'a@b.com' },
              isAdmin: false,
              profileState: {
                isProfileComplete: false,
                missingRequiredFields: ['name', 'surname'],
              },
            },
          }),
      }));

      const store = renderModal({ modalMode: 'login' });

      await user.type(screen.getByLabelText('Email'), 'a@b.com');
      await user.type(screen.getByLabelText('Password'), 'pass123');
      await user.click(getSubmitButton('Login'));

      await waitFor(() => {
        expect(store.getState().auth.modalMode).toBe('complete-profile');
      });
    });
  });
});
