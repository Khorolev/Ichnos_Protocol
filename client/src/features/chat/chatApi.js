import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_BASE_URL } from '../../constants/api';

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: async (headers) => {
      const { auth } = await import('../../config/firebase');
      const user = auth.currentUser;

      if (user) {
        const token = await user.getIdToken();
        headers.set('Authorization', `Bearer ${token}`);
      }

      return headers;
    },
  }),
  tagTypes: ['ChatHistory'],
  endpoints: (builder) => ({
    sendMessage: builder.mutation({
      query: (body) => ({
        url: '/api/chat/message',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ChatHistory'],
    }),
    getHistory: builder.query({
      query: () => '/api/chat/history',
      providesTags: ['ChatHistory'],
    }),
  }),
});

export const { useSendMessageMutation, useGetHistoryQuery } = chatApi;
