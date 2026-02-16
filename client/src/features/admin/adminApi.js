import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const adminApi = createApi({
  reducerPath: 'adminApi',
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
  tagTypes: ['AdminUsers', 'AdminRequests', 'ChatLeads', 'Topics'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => '/api/admin/users',
      providesTags: ['AdminUsers'],
    }),
    getRequests: builder.query({
      query: (userId) => `/api/admin/requests/${userId}`,
      providesTags: ['AdminRequests'],
    }),
    getChatLeads: builder.query({
      query: () => '/api/admin/chat-leads',
      providesTags: ['ChatLeads'],
    }),
    getChatLeadDetail: builder.query({
      query: (userId) => `/api/admin/chat-leads/${userId}`,
      providesTags: ['ChatLeads'],
    }),
    updateRequest: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/admin/request/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AdminRequests'],
    }),
    deleteRequest: builder.mutation({
      query: (id) => ({
        url: `/api/admin/request/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminRequests'],
    }),
    analyzeTopics: builder.mutation({
      query: (body) => ({
        url: '/api/admin/analyze-topics',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Topics'],
    }),
    getTopics: builder.query({
      query: () => '/api/admin/topics',
      providesTags: ['Topics'],
    }),
    exportCSV: builder.query({
      query: () => '/api/admin/export',
    }),
    manageAdmins: builder.mutation({
      query: (body) => ({
        url: '/api/admin/manage-admins',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminUsers'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetRequestsQuery,
  useGetChatLeadsQuery,
  useGetChatLeadDetailQuery,
  useUpdateRequestMutation,
  useDeleteRequestMutation,
  useAnalyzeTopicsMutation,
  useGetTopicsQuery,
  useExportCSVQuery,
  useLazyExportCSVQuery,
  useManageAdminsMutation,
} = adminApi;
