import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import adminReducer from '../../features/admin/adminSlice';
import authReducer from '../../features/auth/authSlice';

vi.mock('../../config/firebase', () => ({
  auth: { currentUser: null },
}));

vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
}));

vi.mock('../organisms/AdminKanban', () => ({
  default: function MockAdminKanban() {
    return <div data-testid="admin-kanban" />;
  },
}));

vi.mock('../organisms/ChatOnlyLeads', () => ({
  default: function MockChatOnlyLeads() {
    return <div data-testid="chat-only-leads" />;
  },
}));

vi.mock('../organisms/UserTimeline', () => ({
  default: function MockUserTimeline({ userId }) {
    return <div data-testid="user-timeline" data-userid={userId} />;
  },
}));

function createStore(overrides = {}) {
  return configureStore({
    reducer: { admin: adminReducer, auth: authReducer },
    preloadedState: {
      admin: {
        users: [],
        expandedLanes: [],
        selectedUser: null,
        filters: {},
        loading: false,
        ...overrides.admin,
      },
      auth: {
        user: { uid: 'u1' },
        isAuthenticated: true,
        isAdmin: true,
        loading: false,
        error: null,
        ...overrides.auth,
      },
    },
  });
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Tabs with Requests as default', async () => {
    const { default: AdminPage } = await import('./AdminPage');
    render(
      <Provider store={createStore()}>
        <AdminPage />
      </Provider>,
    );
    expect(screen.getByText('Requests')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders AdminLayout wrapper', async () => {
    const { default: AdminPage } = await import('./AdminPage');
    render(
      <Provider store={createStore()}>
        <AdminPage />
      </Provider>,
    );
    expect(screen.getByText('Ichnos Admin')).toBeInTheDocument();
  });

  it('renders AdminKanban in Requests tab', async () => {
    const { default: AdminPage } = await import('./AdminPage');
    render(
      <Provider store={createStore()}>
        <AdminPage />
      </Provider>,
    );
    expect(screen.getByTestId('admin-kanban')).toBeInTheDocument();
  });

  it('renders UserTimeline with selectedUser', async () => {
    const { default: AdminPage } = await import('./AdminPage');
    render(
      <Provider store={createStore({ admin: { selectedUser: 'uid-1' } })}>
        <AdminPage />
      </Provider>,
    );
    const timeline = screen.getByTestId('user-timeline');
    expect(timeline).toHaveAttribute('data-userid', 'uid-1');
  });
});
