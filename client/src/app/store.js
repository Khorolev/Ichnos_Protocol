import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../features/auth/authSlice';
import chatReducer from '../features/chat/chatSlice';
import contactReducer from '../features/contact/contactSlice';
import adminReducer from '../features/admin/adminSlice';
import { authApi } from '../features/auth/authApi';
import { chatApi } from '../features/chat/chatApi';
import { contactApi } from '../features/contact/contactApi';
import { adminApi } from '../features/admin/adminApi';
import { gdprApi } from '../features/gdpr/gdprApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    contact: contactReducer,
    admin: adminReducer,
    [authApi.reducerPath]: authApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [contactApi.reducerPath]: contactApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [gdprApi.reducerPath]: gdprApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      chatApi.middleware,
      contactApi.middleware,
      adminApi.middleware,
      gdprApi.middleware,
    ),
});
