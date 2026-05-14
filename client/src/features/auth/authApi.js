import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_BASE_URL } from '../../constants/api';

export const authApi = createApi({
  reducerPath: 'authApi',
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
  tagTypes: ['Profile'],
  endpoints: (builder) => ({
    syncProfile: builder.mutation({
      query: (body) => ({
        url: '/api/auth/sync-profile',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),
    verifyToken: builder.mutation({
      query: () => ({
        url: '/api/auth/verify-token',
        method: 'POST',
      }),
    }),
    getMe: builder.query({
      query: () => '/api/auth/me',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: '/api/auth/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const {
  useSyncProfileMutation,
  useVerifyTokenMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
} = authApi;
