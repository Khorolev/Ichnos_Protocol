import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const contactApi = createApi({
  reducerPath: 'contactApi',
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
  tagTypes: ['ContactRequests'],
  endpoints: (builder) => ({
    submitContact: builder.mutation({
      query: (body) => ({
        url: '/api/contact/submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ContactRequests'],
    }),
    getMyRequests: builder.query({
      query: () => '/api/contact/my-requests',
      providesTags: ['ContactRequests'],
    }),
    updateRequest: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/contact/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ContactRequests'],
    }),
    addQuestion: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/contact/${id}/question`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ContactRequests'],
    }),
  }),
});

export const {
  useSubmitContactMutation,
  useGetMyRequestsQuery,
  useUpdateRequestMutation,
  useAddQuestionMutation,
} = contactApi;
