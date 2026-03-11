import authReducer, {
  setUser,
  setAdmin,
  logout,
  setLoading,
  setError,
} from './authSlice';

const initialState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: false,
  error: null,
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
    };
    const state = authReducer(loggedIn, logout());

    expect(state).toEqual(initialState);
  });

  it('sets loading flag', () => {
    const state = authReducer(initialState, setLoading(true));

    expect(state.loading).toBe(true);
  });

  it('sets error message', () => {
    const state = authReducer(initialState, setError('Something failed'));

    expect(state.error).toBe('Something failed');
  });
});
