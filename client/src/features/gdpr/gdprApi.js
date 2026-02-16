import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const gdprApi = createApi({
  reducerPath: 'gdprApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
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
