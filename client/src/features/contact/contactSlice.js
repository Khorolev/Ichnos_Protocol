import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  formData: {},
  myRequests: [],
  submitting: false,
  error: null,
};

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
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

export const { setFormData, setRequests, setSubmitting, setError } =
  contactSlice.actions;

export default contactSlice.reducer;
