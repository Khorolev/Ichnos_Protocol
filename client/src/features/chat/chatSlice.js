import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  isOpen: false,
  loading: false,
  error: null,
  dailyCount: 0,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action) {
      state.messages.push(action.payload);
    },
    setMessages(state, action) {
      state.messages = action.payload;
    },
    toggleModal(state) {
      state.isOpen = !state.isOpen;
    },
    openModal(state) {
      state.isOpen = true;
    },
    clearError(state) {
      state.error = null;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setDailyCount(state, action) {
      state.dailyCount = action.payload;
    },
  },
});

export const {
  addMessage,
  setMessages,
  toggleModal,
  openModal,
  clearError,
  setLoading,
  setError,
  setDailyCount,
} = chatSlice.actions;

export default chatSlice.reducer;
