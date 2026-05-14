import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_BASE_URL } from '../../constants/api';

export const gdprApi = createApi({
  reducerPath: 'gdprApi',
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
  tagTypes: ['UserData'],
  endpoints: (builder) => ({
    downloadData: builder.query({
      query: () => '/api/gdpr/download',
      providesTags: ['UserData'],
    }),
    deleteAccount: builder.mutation({
      query: () => ({
        url: '/api/gdpr/delete',
        method: 'POST',
        body: { confirm: true },
      }),
      invalidatesTags: ['UserData'],
    }),
  }),
});

export const {
  useDownloadDataQuery,
  useLazyDownloadDataQuery,
  useDeleteAccountMutation,
} = gdprApi;
