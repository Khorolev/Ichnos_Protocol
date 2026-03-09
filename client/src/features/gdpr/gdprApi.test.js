import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('../../config/firebase', () => ({
  auth: { currentUser: null },
}));

describe('gdprApi - deleteAccount endpoint', () => {
  let store;
  let gdprApi;

  beforeEach(async () => {
    vi.resetModules();

    const module = await import('./gdprApi.js');
    gdprApi = module.gdprApi;

    store = configureStore({
      reducer: { [gdprApi.reducerPath]: gdprApi.reducer },
      middleware: (getDefault) => getDefault().concat(gdprApi.middleware),
    });
  });

  it('sends POST to /api/gdpr/delete with { confirm: true } body', async () => {
    let interceptedUrl = null;
    let interceptedMethod = null;
    let interceptedBody = null;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (input) => {
      const request = input instanceof Request ? input : new Request(input);
      interceptedUrl = request.url;
      interceptedMethod = request.method;
      interceptedBody = await request.clone().text();
      return new Response(JSON.stringify({ data: { success: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    try {
      await store.dispatch(gdprApi.endpoints.deleteAccount.initiate());

      expect(interceptedUrl).toContain('/api/gdpr/delete');
      expect(interceptedMethod).toBe('POST');
      expect(JSON.parse(interceptedBody)).toEqual({ confirm: true });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('exports expected hooks', async () => {
    const module = await import('./gdprApi.js');
    expect(module.useDeleteAccountMutation).toBeDefined();
    expect(module.useDownloadDataQuery).toBeDefined();
    expect(module.useLazyDownloadDataQuery).toBeDefined();
  });
});
