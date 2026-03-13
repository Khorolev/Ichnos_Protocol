import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import adminReducer from '../../features/admin/adminSlice';

const mockUpdateRequest = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));
const mockDeleteRequest = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));

vi.mock('../../features/admin/adminApi', () => {
  const requestsData = {
    data: [
      {
        id: 'r1',
        status: 'new',
        questionPreview: 'First question',
        created_at: '2025-01-10',
        adminNotes: '',
      },
      {
        id: 'r2',
        status: 'contacted',
        questionPreview: 'Second question',
        created_at: '2025-01-12',
        adminNotes: 'Note',
      },
    ],
  };

  return {
    useGetRequestsQuery: () => ({ data: requestsData, isLoading: false }),
    useUpdateRequestMutation: () => [mockUpdateRequest, {}],
    useDeleteRequestMutation: () => [mockDeleteRequest, {}],
    adminApi: {
      reducerPath: 'adminApi',
      reducer: (state = {}) => state,
      middleware: () => (next) => (action) => next(action),
    },
  };
});

function createStore(overrides = {}) {
  return configureStore({
    reducer: { admin: adminReducer },
    preloadedState: {
      admin: {
        users: [
          {
            userId: 'uid-1',
            name: 'Jane Doe',
            email: 'jane@test.com',
            company: 'Acme',
            totalRequests: 2,
            lastActivity: '2025-01-15',
          },
        ],
        expandedLanes: [],
        selectedUser: null,
        filters: {},
        loading: false,
        ...overrides.admin,
      },
    },
  });
}

describe('UserTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Offcanvas when userId is set', async () => {
    const { default: UserTimeline } = await import('./UserTimeline');
    render(
      <Provider store={createStore()}>
        <UserTimeline userId="uid-1" onClose={vi.fn()} />
      </Provider>,
    );
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('shows request list', async () => {
    const { default: UserTimeline } = await import('./UserTimeline');
    render(
      <Provider store={createStore()}>
        <UserTimeline userId="uid-1" onClose={vi.fn()} />
      </Provider>,
    );
    expect(screen.getByText('First question')).toBeInTheDocument();
    expect(screen.getByText('Second question')).toBeInTheDocument();
  });

  it('shows RequestDetail when clicking a request', async () => {
    const user = userEvent.setup();
    const { default: UserTimeline } = await import('./UserTimeline');
    render(
      <Provider store={createStore()}>
        <UserTimeline userId="uid-1" onClose={vi.fn()} />
      </Provider>,
    );

    await user.click(screen.getByText('First question'));
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('returns to list when Back is clicked', async () => {
    const user = userEvent.setup();
    const { default: UserTimeline } = await import('./UserTimeline');
    render(
      <Provider store={createStore()}>
        <UserTimeline userId="uid-1" onClose={vi.fn()} />
      </Provider>,
    );

    await user.click(screen.getByText('First question'));
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Second question')).toBeInTheDocument();
  });

  it('resets detail view when userId changes', async () => {
    const user = userEvent.setup();
    const { default: UserTimeline } = await import('./UserTimeline');
    const store = createStore({
      admin: {
        users: [
          {
            userId: 'uid-1',
            name: 'Jane Doe',
            email: 'jane@test.com',
            company: 'Acme',
            totalRequests: 2,
            lastActivity: '2025-01-15',
          },
          {
            userId: 'uid-2',
            name: 'John Smith',
            email: 'john@test.com',
            company: 'Beta',
            totalRequests: 1,
            lastActivity: '2025-02-01',
          },
        ],
        expandedLanes: [],
        selectedUser: null,
        filters: {},
        loading: false,
      },
    });

    const { rerender } = render(
      <Provider store={store}>
        <UserTimeline userId="uid-1" onClose={vi.fn()} />
      </Provider>,
    );

    await user.click(screen.getByText('First question'));
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();

    rerender(
      <Provider store={store}>
        <UserTimeline userId="uid-2" onClose={vi.fn()} />
      </Provider>,
    );

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('shows error alert when save mutation fails', async () => {
    mockUpdateRequest.mockReturnValue({
      unwrap: () => Promise.reject(new Error('fail')),
    });
    const user = userEvent.setup();
    const { default: UserTimeline } = await import('./UserTimeline');
    render(
      <Provider store={createStore()}>
        <UserTimeline userId="uid-1" onClose={vi.fn()} />
      </Provider>,
    );

    await user.click(screen.getByText('First question'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      await screen.findByText('Failed to save changes. Please try again.'),
    ).toBeInTheDocument();
  });

  it('clears error alert when navigating back and opening another request', async () => {
    mockUpdateRequest.mockReturnValue({
      unwrap: () => Promise.reject(new Error('fail')),
    });
    const user = userEvent.setup();
    const { default: UserTimeline } = await import('./UserTimeline');
    render(
      <Provider store={createStore()}>
        <UserTimeline userId="uid-1" onClose={vi.fn()} />
      </Provider>,
    );

    await user.click(screen.getByText('First question'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      await screen.findByText('Failed to save changes. Please try again.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByText('Second question'));
    expect(
      screen.queryByText('Failed to save changes. Please try again.'),
    ).not.toBeInTheDocument();
  });

  it('shows error alert when delete mutation fails', async () => {
    mockDeleteRequest.mockReturnValue({
      unwrap: () => Promise.reject(new Error('fail')),
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    const { default: UserTimeline } = await import('./UserTimeline');
    render(
      <Provider store={createStore()}>
        <UserTimeline userId="uid-1" onClose={vi.fn()} />
      </Provider>,
    );

    await user.click(screen.getByText('First question'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(
      await screen.findByText('Failed to delete request. Please try again.'),
    ).toBeInTheDocument();
    window.confirm.mockRestore();
  });
});
