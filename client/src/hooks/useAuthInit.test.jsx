import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import authReducer, { setEnforcedLogout } from '../features/auth/authSlice';

let mockAuthCallback = null;
let mockGetMeResponse = null;

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth, callback) => {
    mockAuthCallback = callback;
    return vi.fn();
  }),
  getAuth: vi.fn(() => ({})),
}));

vi.mock('../config/firebase', () => ({
  auth: {},
}));

vi.mock('../features/auth/authApi', () => ({
  authApi: {
    endpoints: {
      getMe: {
        initiate: vi.fn(() => ({
          type: '__MOCK_GET_ME__',
        })),
      },
    },
  },
}));

vi.mock('../helpers/profileCompletion', () => ({
  isCompletionRequired: vi.fn(),
  markCompletionShown: vi.fn(),
  wasCompletionShown: vi.fn(),
  clearCompletionShown: vi.fn(),
}));

const {
  isCompletionRequired,
  markCompletionShown,
  wasCompletionShown,
  clearCompletionShown,
} = await import('../helpers/profileCompletion');

const { useAuthInit } = await import('./useAuthInit');

const getMeMiddleware = () => (next) => (action) => {
  if (action?.type === '__MOCK_GET_ME__') {
    return Object.assign(
      Promise.resolve(mockGetMeResponse),
      { unsubscribe: vi.fn() },
    );
  }
  return next(action);
};

function createStore() {
  return configureStore({
    reducer: { auth: authReducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(getMeMiddleware),
  });
}

function renderUseAuthInit(store) {
  return renderHook(() => useAuthInit(), {
    wrapper: ({ children }) => (
      <Provider store={store}>{children}</Provider>
    ),
  });
}

describe('useAuthInit', () => {
  let originalPathname;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCallback = null;
    mockGetMeResponse = null;
    originalPathname = window.location.pathname;
    wasCompletionShown.mockReturnValue(false);
    isCompletionRequired.mockReturnValue(false);
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: originalPathname },
      writable: true,
    });
  });

  it('does not dispatch openAuthModal for complete profile', async () => {
    const store = createStore();
    isCompletionRequired.mockReturnValue(false);
    mockGetMeResponse = {
      data: {
        data: {
          user: { uid: 'u1', email: 'a@b.com' },
          isAdmin: false,
          profileState: { isProfileComplete: true, missingRequiredFields: [] },
        },
      },
    };

    renderUseAuthInit(store);
    await mockAuthCallback({ uid: 'u1', email: 'a@b.com' });

    await waitFor(() => {
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.modalMode).toBeNull();
    });
  });

  it('dispatches openAuthModal for incomplete profile on public route', async () => {
    const store = createStore();
    isCompletionRequired.mockReturnValue(true);
    mockGetMeResponse = {
      data: {
        data: {
          user: { uid: 'u1', email: 'a@b.com' },
          isAdmin: false,
          profileState: {
            isProfileComplete: false,
            missingRequiredFields: ['name'],
          },
        },
      },
    };

    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/services' },
      writable: true,
    });

    renderUseAuthInit(store);
    await mockAuthCallback({ uid: 'u1', email: 'a@b.com' });

    await waitFor(() => {
      expect(store.getState().auth.modalMode).toBe('complete-profile');
    });
    expect(markCompletionShown).toHaveBeenCalled();
  });

  it('does NOT dispatch openAuthModal on admin route', async () => {
    const store = createStore();
    isCompletionRequired.mockReturnValue(true);
    mockGetMeResponse = {
      data: {
        data: {
          user: { uid: 'u1', email: 'a@b.com' },
          isAdmin: true,
          profileState: { isProfileComplete: false },
        },
      },
    };

    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/admin/requests' },
      writable: true,
    });

    renderUseAuthInit(store);
    await mockAuthCallback({ uid: 'u1', email: 'a@b.com' });

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });
    expect(store.getState().auth.modalMode).toBeNull();
  });

  it('does not re-trigger if wasCompletionShown returns true', async () => {
    const store = createStore();
    isCompletionRequired.mockReturnValue(true);
    wasCompletionShown.mockReturnValue(true);
    mockGetMeResponse = {
      data: {
        data: {
          user: { uid: 'u1', email: 'a@b.com' },
          isAdmin: false,
          profileState: { isProfileComplete: false },
        },
      },
    };

    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/' },
      writable: true,
    });

    renderUseAuthInit(store);
    await mockAuthCallback({ uid: 'u1', email: 'a@b.com' });

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });
    expect(store.getState().auth.modalMode).toBeNull();
    expect(markCompletionShown).not.toHaveBeenCalled();
  });

  it('calls clearCompletionShown on logout', async () => {
    const store = createStore();

    renderUseAuthInit(store);
    await mockAuthCallback(null);

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(false);
    });
    expect(clearCompletionShown).toHaveBeenCalled();
  });

  it('preserves enforcedLogout flag when onAuthStateChanged fires with null', async () => {
    const store = createStore();
    store.dispatch(setEnforcedLogout(true));

    renderUseAuthInit(store);
    await mockAuthCallback(null);

    await waitFor(() => {
      const state = store.getState().auth;
      expect(state.enforcedLogout).toBe(true);
      expect(state.isAuthenticated).toBe(false);
    });
    expect(clearCompletionShown).toHaveBeenCalled();
  });

  describe('user shape contract from /me response', () => {
    // NOTE: T1 runtime /me still returns repository-shaped snake_case keys
    // (e.g. firebase_uid). useAuthInit must store whatever /me returns into
    // Redux unchanged — it does not synthesize a camelCase firebaseUid.
    // Later server tickets will normalize the /me contract to camelCase.
    it('stores T1 /me user object (firebase_uid) into Redux unchanged', async () => {
      const store = createStore();
      isCompletionRequired.mockReturnValue(false);
      const meUser = {
        firebase_uid: 'uid-1',
        name: 'John',
        surname: 'Doe',
        email: 'a@b.com',
        phone: '+1234567890',
        company: 'Acme',
        linkedin: 'https://linkedin.com/in/johndoe',
      };
      mockGetMeResponse = {
        data: {
          data: {
            user: meUser,
            isAdmin: false,
            profileState: {
              isProfileComplete: true,
              missingRequiredFields: [],
            },
          },
        },
      };

      renderUseAuthInit(store);
      await mockAuthCallback({ uid: 'uid-1', email: 'a@b.com' });

      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(true);
      });

      const storedUser = store.getState().auth.user;
      // Passthrough contract: the stored user must be deep-equal to the
      // mocked /me user — no synthesized keys, no transformed keys, no drops.
      expect(storedUser).toEqual(meUser);
      expect(Object.keys(storedUser).sort()).toEqual(
        Object.keys(meUser).sort(),
      );
      // Explicit opposite-key absence: this test must fail if a future
      // normalization step starts synthesizing a camelCase firebaseUid.
      expect(storedUser).not.toHaveProperty('firebaseUid');
    });

    // Passthrough behavior: if an already-normalized (camelCase) user object
    // is ever returned by /me, useAuthInit must also store it unchanged.
    // This is NOT the current T1 /me contract — it characterizes the generic
    // passthrough behavior of the hook against a future normalized shape.
    it('stores an already-normalized camelCase user object into Redux unchanged (passthrough)', async () => {
      const store = createStore();
      isCompletionRequired.mockReturnValue(false);
      const meUser = {
        firebaseUid: 'uid-1',
        email: 'a@b.com',
        name: 'John',
        surname: 'Doe',
        phone: '+1234567890',
        company: 'Acme',
        linkedin: 'https://linkedin.com/in/johndoe',
      };
      mockGetMeResponse = {
        data: {
          data: {
            user: meUser,
            isAdmin: false,
            profileState: {
              isProfileComplete: true,
              missingRequiredFields: [],
            },
          },
        },
      };

      renderUseAuthInit(store);
      await mockAuthCallback({ uid: 'uid-1', email: 'a@b.com' });

      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(true);
      });

      const storedUser = store.getState().auth.user;
      // Passthrough contract: the stored user must be deep-equal to the
      // mocked /me user — no synthesized keys, no transformed keys, no drops.
      expect(storedUser).toEqual(meUser);
      expect(Object.keys(storedUser).sort()).toEqual(
        Object.keys(meUser).sort(),
      );
      // Explicit opposite-key absence: this test must fail if a future
      // denormalization step starts introducing a snake_case firebase_uid.
      expect(storedUser).not.toHaveProperty('firebase_uid');
    });
  });
});
