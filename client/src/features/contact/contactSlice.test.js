import contactReducer, {
  setFormData,
  setRequests,
  setSubmitting,
  setError,
} from './contactSlice';

const initialState = {
  formData: {},
  myRequests: [],
  submitting: false,
  error: null,
};

describe('contactSlice', () => {
  it('returns the initial state', () => {
    expect(contactReducer(undefined, { type: 'unknown' })).toEqual(
      initialState,
    );
  });

  it('updates form data with setFormData', () => {
    const data = { name: 'John', email: 'john@example.com' };
    const state = contactReducer(initialState, setFormData(data));

    expect(state.formData).toEqual(data);
  });

  it('replaces requests with setRequests', () => {
    const requests = [{ id: '1', message: 'Help' }];
    const state = contactReducer(initialState, setRequests(requests));

    expect(state.myRequests).toEqual(requests);
  });

  it('sets submitting flag', () => {
    const state = contactReducer(initialState, setSubmitting(true));

    expect(state.submitting).toBe(true);
  });

  it('sets error message', () => {
    const state = contactReducer(initialState, setError('Submit failed'));

    expect(state.error).toBe('Submit failed');
  });
});
