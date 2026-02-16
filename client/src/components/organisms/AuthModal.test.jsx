import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

import { renderWithProviders, screen, waitFor } from '../../test-utils';
import AuthModal from './AuthModal';

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  getAuth: vi.fn(() => ({})),
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

const { signInWithEmailAndPassword, createUserWithEmailAndPassword } =
  await import('firebase/auth');

function getSubmitButton(name) {
  const buttons = screen.getAllByRole('button', { name });
  return buttons.find((btn) => btn.getAttribute('type') === 'submit');
}

describe('AuthModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    renderWithProviders(<AuthModal isOpen onClose={onClose} />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(getSubmitButton('Login')).toBeInTheDocument();
  });

  it('switches to signup form when Sign Up tab clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal isOpen onClose={onClose} />);

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

    renderWithProviders(<AuthModal isOpen onClose={onClose} />);

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

    renderWithProviders(<AuthModal isOpen onClose={onClose} />);

    await user.click(screen.getByText('Sign Up'));
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

    renderWithProviders(<AuthModal isOpen onClose={onClose} />);

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(getSubmitButton('Login'));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });
  });

  it('does not render when isOpen is false', () => {
    const { container } = renderWithProviders(
      <AuthModal isOpen={false} onClose={onClose} />,
    );

    expect(container.querySelector('.modal')).not.toBeInTheDocument();
  });
});
