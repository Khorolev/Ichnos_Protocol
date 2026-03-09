import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import adminReducer from '../../features/admin/adminSlice';
import authReducer from '../../features/auth/authSlice';

let mockIsSuperAdmin = false;

vi.mock('../../config/firebase', () => ({
  auth: { currentUser: null },
}));

vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('../../hooks/useSuperAdminCheck', () => ({
  useSuperAdminCheck: () => mockIsSuperAdmin,
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

vi.mock('../organisms/TopicAnalytics', () => ({
  default: function MockTopicAnalytics() {
    return <div data-testid="topic-analytics" />;
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
    mockIsSuperAdmin = false;
  });

  it('renders Tabs with Requests and Analytics', async () => {
    const { default: AdminPage } = await import('./AdminPage');
    render(
      <Provider store={createStore()}>
        <AdminPage />
      </Provider>,
    );
    expect(screen.getByText('Requests')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
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

  describe('Settings tab visibility', () => {
    it('does not render Settings tab for non-super-admin', async () => {
      mockIsSuperAdmin = false;
      const { default: AdminPage } = await import('./AdminPage');
      render(
        <Provider store={createStore()}>
          <AdminPage />
        </Provider>,
      );
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('renders Settings tab for super-admin', async () => {
      mockIsSuperAdmin = true;
      const { default: AdminPage } = await import('./AdminPage');
      render(
        <Provider store={createStore()}>
          <AdminPage />
        </Provider>,
      );
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });
});
