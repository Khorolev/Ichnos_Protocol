import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  requestId: null,
  formData: {},
  myRequests: [],
  submitting: false,
  error: null,
};

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    openModal(state, action) {
      state.isOpen = true;
      state.requestId = action.payload?.requestId || null;
    },
    closeModal(state) {
      state.isOpen = false;
      state.requestId = null;
    },
    setFormData(state, action) {
      state.formData = action.payload;
    },
    setRequests(state, action) {
      state.myRequests = action.payload;
    },
    setSubmitting(state, action) {
      state.submitting = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  openModal,
  closeModal,
  setFormData,
  setRequests,
  setSubmitting,
  setError,
} = contactSlice.actions;

export default contactSlice.reducer;
