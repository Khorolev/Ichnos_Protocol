import chatReducer, {
  addMessage,
  setMessages,
  toggleModal,
  setLoading,
  setError,
  setDailyCount,
} from './chatSlice';

const initialState = {
  messages: [],
  isOpen: false,
  loading: false,
  error: null,
  dailyCount: 0,
};

describe('chatSlice', () => {
  it('returns the initial state', () => {
    expect(chatReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('appends a message with addMessage', () => {
    const msg = { role: 'user', content: 'Hello' };
    const state = chatReducer(initialState, addMessage(msg));

    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toEqual(msg);
  });

  it('replaces messages with setMessages', () => {
    const existing = { ...initialState, messages: [{ role: 'user', content: 'old' }] };
    const newMsgs = [{ role: 'assistant', content: 'Hi' }];
    const state = chatReducer(existing, setMessages(newMsgs));

    expect(state.messages).toEqual(newMsgs);
  });

  it('toggles isOpen with toggleModal', () => {
    const state1 = chatReducer(initialState, toggleModal());

    expect(state1.isOpen).toBe(true);

    const state2 = chatReducer(state1, toggleModal());

    expect(state2.isOpen).toBe(false);
  });

  it('sets loading flag', () => {
    const state = chatReducer(initialState, setLoading(true));

    expect(state.loading).toBe(true);
  });

  it('sets error message', () => {
    const state = chatReducer(initialState, setError('Chat error'));

    expect(state.error).toBe('Chat error');
  });

  it('sets daily count', () => {
    const state = chatReducer(initialState, setDailyCount(5));

    expect(state.dailyCount).toBe(5);
  });
});
