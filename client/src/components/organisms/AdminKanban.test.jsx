import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import adminReducer from '../../features/admin/adminSlice';

vi.mock('../../features/admin/adminApi', () => {
  const usersData = {
    data: [
      {
        userId: 'uid-1',
        name: 'Jane Doe',
        email: 'jane@test.com',
        company: 'Acme',
        totalRequests: 2,
        lastActivity: '2025-01-15',
      },
    ],
  };
  const requestsData = { data: [] };

  return {
    useGetUsersQuery: () => ({ data: usersData, isLoading: false }),
    useGetRequestsQuery: () => ({ data: requestsData, isLoading: false }),
    adminApi: {
      reducerPath: 'adminApi',
      reducer: (state = {}) => state,
      middleware: () => (next) => (action) => next(action),
      util: { invalidateTags: vi.fn(() => ({ type: 'adminApi/invalidateTags' })) },
    },
  };
});

function createStore(overrides = {}) {
  return configureStore({
    reducer: { admin: adminReducer },
    preloadedState: {
      admin: {
        users: [],
        expandedLanes: [],
        selectedUser: null,
        filters: {},
        loading: false,
        ...overrides.admin,
      },
    },
  });
}

describe('AdminKanban', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user list after loading', async () => {
    const { default: AdminKanban } = await import('./AdminKanban');
    const store = createStore();
    render(
      <Provider store={store}>
        <AdminKanban />
      </Provider>,
    );
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders Refresh button', async () => {
    const { default: AdminKanban } = await import('./AdminKanban');
    const store = createStore();
    render(
      <Provider store={store}>
        <AdminKanban />
      </Provider>,
    );
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('dispatches toggleLane when chevron is clicked', async () => {
    const user = userEvent.setup();
    const { default: AdminKanban } = await import('./AdminKanban');
    const store = createStore();
    render(
      <Provider store={store}>
        <AdminKanban />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(store.getState().admin.expandedLanes).toContain('uid-1');
  });
});
