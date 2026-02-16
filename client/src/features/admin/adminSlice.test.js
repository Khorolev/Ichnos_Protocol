import adminReducer, {
  setUsers,
  toggleLane,
  selectUser,
  setFilters,
  setLoading,
} from './adminSlice';

const initialState = {
  users: [],
  expandedLanes: [],
  selectedUser: null,
  filters: {},
  loading: false,
};

describe('adminSlice', () => {
  it('returns the initial state', () => {
    expect(adminReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('replaces users with setUsers', () => {
    const users = [{ id: '1', name: 'Alice' }];
    const state = adminReducer(initialState, setUsers(users));

    expect(state.users).toEqual(users);
  });

  it('adds a lane id with toggleLane', () => {
    const state = adminReducer(initialState, toggleLane('user-1'));

    expect(state.expandedLanes).toContain('user-1');
  });

  it('removes a lane id with toggleLane when already present', () => {
    const withLane = { ...initialState, expandedLanes: ['user-1'] };
    const state = adminReducer(withLane, toggleLane('user-1'));

    expect(state.expandedLanes).not.toContain('user-1');
  });

  it('updates selectedUser with selectUser', () => {
    const user = { id: '1', name: 'Alice' };
    const state = adminReducer(initialState, selectUser(user));

    expect(state.selectedUser).toEqual(user);
  });

  it('updates filters with setFilters', () => {
    const filters = { status: 'new' };
    const state = adminReducer(initialState, setFilters(filters));

    expect(state.filters).toEqual(filters);
  });

  it('sets loading flag', () => {
    const state = adminReducer(initialState, setLoading(true));

    expect(state.loading).toBe(true);
  });
});
