import { API_HEALTH_PATH, API_SANITY_TIMEOUT_MS } from '../constants/api';

export async function checkApiHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_SANITY_TIMEOUT_MS);

  try {
    const response = await fetch(API_HEALTH_PATH, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        ok: false,
        warning:
          'API health check returned an error. The server may be experiencing issues.',
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        warning:
          'API routing is misconfigured — /api/health did not return valid JSON. Check your proxy or deployment configuration.',
      };
    }

    const body = await response.json();
    if (body.status !== 'ok') {
      return {
        ok: false,
        warning:
          'API routing is misconfigured — /api/health did not return valid JSON. Check your proxy or deployment configuration.',
      };
    }

    return { ok: true, warning: null };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return {
        ok: false,
        warning:
          'API health check timed out. The server may be starting up — try refreshing in a moment.',
      };
    }

    return {
      ok: false,
      warning:
        'Unable to reach the API server. Check that the backend is running and properly configured.',
    };
  }
}
