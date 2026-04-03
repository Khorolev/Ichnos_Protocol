import { createSlice } from '@reduxjs/toolkit';

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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setAdmin(state, action) {
      state.isAdmin = action.payload;
    },
    logout(state) {
      return { ...initialState, enforcedLogout: state.enforcedLogout };
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    openAuthModal(state, action) {
      state.modalMode = action.payload;
      state.enforcedLogout = false;
    },
    closeAuthModal(state) {
      if (state.modalMode !== 'complete-profile') {
        state.modalMode = null;
      }
    },
    forceCloseAuthModal(state) {
      state.modalMode = null;
    },
    setProfileState(state, action) {
      state.profileState = action.payload;
    },
    setAuthSuccess(state, action) {
      state.authSuccess = action.payload;
    },
    setEnforcedLogout(state, action) {
      state.enforcedLogout = action.payload;
    },
  },
});

export const {
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
} = authSlice.actions;

export default authSlice.reducer;
