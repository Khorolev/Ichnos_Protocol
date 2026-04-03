import { describe, it, expect, vi, afterEach } from 'vitest';

import { checkApiHealth } from './apiHealthCheck';

describe('checkApiHealth', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns ok when response is valid JSON with status "ok"', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const result = await checkApiHealth();
    expect(result).toEqual({ ok: true, warning: null });
  });

  it('returns warning for non-JSON response', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response('<html></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    const result = await checkApiHealth();
    expect(result.ok).toBe(false);
    expect(result.warning).toContain('misconfigured');
  });

  it('returns warning when JSON lacks status "ok"', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ status: 'error' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const result = await checkApiHealth();
    expect(result.ok).toBe(false);
    expect(result.warning).toContain('misconfigured');
  });

  it('returns warning on network error', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new TypeError('Failed to fetch')),
    );

    const result = await checkApiHealth();
    expect(result.ok).toBe(false);
    expect(result.warning).toContain('Unable to reach');
  });

  it('returns warning on timeout (AbortError)', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    globalThis.fetch = vi.fn(() => Promise.reject(abortError));

    const result = await checkApiHealth();
    expect(result.ok).toBe(false);
    expect(result.warning).toContain('timed out');
  });

  it('returns warning on HTTP 500 error', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const result = await checkApiHealth();
    expect(result.ok).toBe(false);
    expect(result.warning).not.toBeNull();
  });
});
