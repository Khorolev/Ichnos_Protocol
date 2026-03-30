import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  users: [],
  expandedLanes: [],
  selectedUser: null,
  filters: {},
  loading: false,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setUsers(state, action) {
      state.users = action.payload;
    },
    toggleLane(state, action) {
      const id = action.payload;
      const index = state.expandedLanes.indexOf(id);

      if (index === -1) {
        state.expandedLanes.push(id);
      } else {
        state.expandedLanes.splice(index, 1);
      }
    },
    selectUser(state, action) {
      state.selectedUser = action.payload;
    },
    setFilters(state, action) {
      state.filters = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const { setUsers, toggleLane, selectUser, setFilters, setLoading } =
  adminSlice.actions;

export default adminSlice.reducer;
