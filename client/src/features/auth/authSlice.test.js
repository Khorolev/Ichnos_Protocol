import authReducer, {
  setUser,
  setAdmin,
  logout,
  setLoading,
  setError,
  openAuthModal,
  closeAuthModal,
  forceCloseAuthModal,
  setProfileState,
  setAuthSuccess,
  setEnforcedLogout,
} from './authSlice';

const initialState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: false,
  error: null,
  modalMode: null,
  profileState: null,
  authSuccess: false,
  enforcedLogout: false,
};

describe('authSlice', () => {
  it('returns the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('sets user and marks authenticated', () => {
    const user = { uid: '1', email: 'a@b.com' };
    const state = authReducer(initialState, setUser(user));

    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  it('sets admin flag', () => {
    const state = authReducer(initialState, setAdmin(true));

    expect(state.isAdmin).toBe(true);
  });

  it('resets state on logout', () => {
    const loggedIn = {
      user: { uid: '1' },
      isAuthenticated: true,
      isAdmin: true,
      loading: false,
      error: null,
      modalMode: 'login',
      profileState: { isProfileComplete: true },
      authSuccess: true,
      enforcedLogout: false,
    };
    const state = authReducer(loggedIn, logout());

    expect(state).toEqual(initialState);
  });

  describe('logout enforcedLogout preservation', () => {
    it('preserves enforcedLogout: true through logout', () => {
      const prev = {
        user: { uid: '1' },
        isAuthenticated: true,
        isAdmin: true,
        loading: false,
        error: null,
        modalMode: 'login',
        profileState: { isProfileComplete: true },
        authSuccess: true,
        enforcedLogout: true,
      };
      const state = authReducer(prev, logout());

      expect(state.enforcedLogout).toBe(true);
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isAdmin).toBe(false);
      expect(state.modalMode).toBeNull();
      expect(state.authSuccess).toBe(false);
    });

    it('preserves enforcedLogout: false through logout', () => {
      const prev = {
        ...initialState,
        user: { uid: '1' },
        isAuthenticated: true,
        enforcedLogout: false,
      };
      const state = authReducer(prev, logout());

      expect(state).toEqual(initialState);
    });
  });

  it('sets loading flag', () => {
    const state = authReducer(initialState, setLoading(true));

    expect(state.loading).toBe(true);
  });

  it('sets error message', () => {
    const state = authReducer(initialState, setError('Something failed'));

    expect(state.error).toBe('Something failed');
  });

  describe('openAuthModal', () => {
    it('sets modalMode to login', () => {
      const state = authReducer(initialState, openAuthModal('login'));

      expect(state.modalMode).toBe('login');
    });

    it('sets modalMode to signup', () => {
      const state = authReducer(initialState, openAuthModal('signup'));

      expect(state.modalMode).toBe('signup');
    });

    it('sets modalMode to complete-profile', () => {
      const state = authReducer(
        initialState,
        openAuthModal('complete-profile'),
      );

      expect(state.modalMode).toBe('complete-profile');
    });
  });

  describe('closeAuthModal', () => {
    it('sets modalMode to null when in login mode', () => {
      const prev = { ...initialState, modalMode: 'login' };
      const state = authReducer(prev, closeAuthModal());

      expect(state.modalMode).toBeNull();
    });

    it('sets modalMode to null when in signup mode', () => {
      const prev = { ...initialState, modalMode: 'signup' };
      const state = authReducer(prev, closeAuthModal());

      expect(state.modalMode).toBeNull();
    });

    it('keeps complete-profile mode when closeAuthModal is dispatched', () => {
      const prev = { ...initialState, modalMode: 'complete-profile' };
      const state = authReducer(prev, closeAuthModal());

      expect(state.modalMode).toBe('complete-profile');
    });
  });

  describe('forceCloseAuthModal', () => {
    it('sets modalMode to null from login', () => {
      const prev = { ...initialState, modalMode: 'login' };
      const state = authReducer(prev, forceCloseAuthModal());

      expect(state.modalMode).toBeNull();
    });

    it('sets modalMode to null from complete-profile', () => {
      const prev = { ...initialState, modalMode: 'complete-profile' };
      const state = authReducer(prev, forceCloseAuthModal());

      expect(state.modalMode).toBeNull();
    });
  });

  describe('openAuthModal enforcedLogout reset', () => {
    it('clears enforcedLogout when opening auth modal', () => {
      const prev = { ...initialState, enforcedLogout: true };
      const state = authReducer(prev, openAuthModal('login'));

      expect(state.enforcedLogout).toBe(false);
      expect(state.modalMode).toBe('login');
    });
  });

  describe('setAuthSuccess', () => {
    it('sets authSuccess to true', () => {
      const state = authReducer(initialState, setAuthSuccess(true));

      expect(state.authSuccess).toBe(true);
    });

    it('sets authSuccess to false', () => {
      const prev = { ...initialState, authSuccess: true };
      const state = authReducer(prev, setAuthSuccess(false));

      expect(state.authSuccess).toBe(false);
    });
  });

  describe('setEnforcedLogout', () => {
    it('sets enforcedLogout to true', () => {
      const state = authReducer(initialState, setEnforcedLogout(true));

      expect(state.enforcedLogout).toBe(true);
    });

    it('sets enforcedLogout to false', () => {
      const prev = { ...initialState, enforcedLogout: true };
      const state = authReducer(prev, setEnforcedLogout(false));

      expect(state.enforcedLogout).toBe(false);
    });
  });

  describe('setProfileState', () => {
    it('stores profileState payload', () => {
      const profile = {
        isProfileComplete: false,
        missingRequiredFields: ['name', 'surname'],
      };
      const state = authReducer(initialState, setProfileState(profile));

      expect(state.profileState).toEqual(profile);
    });

    it('stores null profileState', () => {
      const prev = {
        ...initialState,
        profileState: { isProfileComplete: true },
      };
      const state = authReducer(prev, setProfileState(null));

      expect(state.profileState).toBeNull();
    });
  });
});
