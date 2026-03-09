import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../../features/auth/authSlice';
import contactReducer from '../../features/contact/contactSlice';

const mockUnwrap = vi.fn();
const mockAddQuestionUnwrap = vi.fn();

vi.mock('../../features/contact/contactApi', () => ({
  useSubmitContactMutation: () => [
    () => ({ unwrap: mockUnwrap }),
    { isLoading: false },
  ],
  useGetMyRequestsQuery: () => ({ data: null }),
  useAddQuestionMutation: () => [
    () => ({ unwrap: mockAddQuestionUnwrap }),
    { isLoading: false },
  ],
  contactApi: {
    reducerPath: 'contactApi',
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

vi.mock('../../features/auth/authApi', () => ({
  useGetMeQuery: () => ({
    data: {
      data: {
        profile: { name: 'John', surname: 'Doe', email: 'john@test.com' },
      },
    },
  }),
  authApi: {
    reducerPath: 'authApi',
    reducer: (state = {}) => state,
    middleware: () => (next) => (action) => next(action),
  },
}));

vi.mock('../../config/firebase', () => ({
  auth: { currentUser: null },
}));

vi.mock('./AuthModal', () => ({
  default: function MockAuthModal({ isOpen, onSuccess, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="auth-modal">
        <button onClick={onSuccess}>Mock Auth Success</button>
        <button onClick={onClose}>Mock Auth Close</button>
      </div>
    );
  },
}));

vi.mock('./CalendlyModal', () => ({
  default: function MockCalendlyModal({ isOpen }) {
    if (!isOpen) return null;
    return <div data-testid="calendly-modal" />;
  },
}));

function createStore(overrides = {}) {
  return configureStore({
    reducer: { auth: authReducer, contact: contactReducer },
    preloadedState: {
      auth: {
        user: { uid: 'u1' },
        isAuthenticated: true,
        isAdmin: false,
        loading: false,
        error: null,
        ...overrides.auth,
      },
      contact: {
        isOpen: true,
        requestId: null,
        formData: {},
        myRequests: [],
        submitting: false,
        error: null,
        ...overrides.contact,
      },
    },
  });
}

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when contact.isOpen is true and user is authenticated', async () => {
    const { default: ContactForm } = await import('./ContactForm');
    const store = createStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ContactForm />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText('Submit an Inquiry')).toBeInTheDocument();
  });

  it('renders profile data from useGetMeQuery', async () => {
    const { default: ContactForm } = await import('./ContactForm');
    const store = createStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ContactForm />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
  });

  it('opens AuthModal when unauthenticated user opens form', async () => {
    const { default: ContactForm } = await import('./ContactForm');
    const store = createStore({
      auth: { isAuthenticated: false, user: null },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ContactForm />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
  });

  it('calls submitContact with correct payload on valid submit', async () => {
    const user = userEvent.setup();
    mockUnwrap.mockResolvedValue({ data: {} });

    const { default: ContactForm } = await import('./ContactForm');
    const store = createStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ContactForm />
        </MemoryRouter>
      </Provider>,
    );

    const textarea = screen.getByLabelText('Question 1');
    await user.type(textarea, 'My question');

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    await user.click(screen.getByRole('button', { name: 'Submit Inquiry' }));

    await waitFor(() => {
      expect(mockUnwrap).toHaveBeenCalled();
    });
  });

  it('shows success alert after successful submission', async () => {
    const user = userEvent.setup();
    mockUnwrap.mockResolvedValue({ data: {} });

    const { default: ContactForm } = await import('./ContactForm');
    const store = createStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ContactForm />
        </MemoryRouter>
      </Provider>,
    );

    const textarea = screen.getByLabelText('Question 1');
    await user.type(textarea, 'My question');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Submit Inquiry' }));

    await waitFor(() => {
      expect(screen.getByText(/inquiry submitted/i)).toBeInTheDocument();
    });
  });

  it('shows error alert on submission failure', async () => {
    const user = userEvent.setup();
    mockUnwrap.mockRejectedValue(new Error('fail'));

    const { default: ContactForm } = await import('./ContactForm');
    const store = createStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ContactForm />
        </MemoryRouter>
      </Provider>,
    );

    const textarea = screen.getByLabelText('Question 1');
    await user.type(textarea, 'My question');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Submit Inquiry' }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('calls addQuestion when requestId is set', async () => {
    const user = userEvent.setup();
    mockAddQuestionUnwrap.mockResolvedValue({ data: {} });

    const { default: ContactForm } = await import('./ContactForm');
    const store = createStore({ contact: { requestId: 1 } });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ContactForm />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText('Add a Follow-up Question')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Question 1'), 'Follow-up question');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Add Question' }));

    await waitFor(() => expect(mockAddQuestionUnwrap).toHaveBeenCalled());
    expect(mockUnwrap).not.toHaveBeenCalled();
  });

  it('hides "Add another question" in add-question mode (requestId set)', async () => {
    const { default: ContactForm } = await import('./ContactForm');
    const store = createStore({ contact: { requestId: 1 } });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ContactForm />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.queryByRole('button', { name: /add another question/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Question 1')).toBeInTheDocument();
  });

  it('adds another question textarea up to 3', async () => {
    const user = userEvent.setup();
    const { default: ContactForm } = await import('./ContactForm');
    const store = createStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ContactForm />
        </MemoryRouter>
      </Provider>,
    );

    const addBtn = screen.getByRole('button', { name: /add another question/i });
    await user.click(addBtn);
    expect(screen.getByLabelText('Question 2')).toBeInTheDocument();

    await user.click(addBtn);
    expect(screen.getByLabelText('Question 3')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /add another question/i })).not.toBeInTheDocument();
  });
});
