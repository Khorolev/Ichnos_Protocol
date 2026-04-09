import { store } from './store';

describe('Redux store', () => {
  it('is created successfully', () => {
    expect(store).toBeDefined();
    expect(store.getState).toBeDefined();
    expect(store.dispatch).toBeDefined();
  });

  it('has all slice reducers registered', () => {
    const state = store.getState();

    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty('chat');
    expect(state).toHaveProperty('contact');
    expect(state).toHaveProperty('admin');
  });

  it('has all RTK Query reducers registered', () => {
    const state = store.getState();

    expect(state).toHaveProperty('authApi');
    expect(state).toHaveProperty('chatApi');
    expect(state).toHaveProperty('contactApi');
    expect(state).toHaveProperty('adminApi');
    expect(state).toHaveProperty('gdprApi');
  });

  it('has correct auth initial state', () => {
    const { auth } = store.getState();

    expect(auth.user).toBeNull();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.isAdmin).toBe(false);
    expect(auth.loading).toBe(true);
    expect(auth.error).toBeNull();
  });

  it('has correct chat initial state', () => {
    const { chat } = store.getState();

    expect(chat.messages).toEqual([]);
    expect(chat.isOpen).toBe(false);
    expect(chat.dailyCount).toBe(0);
  });

  it('has correct contact initial state', () => {
    const { contact } = store.getState();

    expect(contact.formData).toEqual({});
    expect(contact.myRequests).toEqual([]);
    expect(contact.submitting).toBe(false);
  });

  it('has correct admin initial state', () => {
    const { admin } = store.getState();

    expect(admin.users).toEqual([]);
    expect(admin.expandedLanes).toEqual([]);
    expect(admin.selectedUser).toBeNull();
  });
});
