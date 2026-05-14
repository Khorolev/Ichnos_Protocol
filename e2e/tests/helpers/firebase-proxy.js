/**
 * Firebase API proxy for Playwright browser contexts.
 *
 * GitHub Actions runners sometimes block or strip CORS headers from
 * requests to identitytoolkit.googleapis.com and securetoken.googleapis.com,
 * causing signInWithEmailAndPassword to fail with a network error.
 *
 * This helper intercepts those requests at the Playwright route level and
 * proxies them through Node.js fetch (which has no CORS restrictions).
 * The browser receives the response as if CORS was allowed.
 */

const FIREBASE_API_PATTERNS = [
  '**/identitytoolkit.googleapis.com/**',
  '**/securetoken.googleapis.com/**',
];

/**
 * Registers route handlers on a browser context that proxy Firebase API
 * requests through Node.js, bypassing browser CORS enforcement.
 *
 * @param {import('@playwright/test').BrowserContext} context
 */
export async function setupFirebaseProxy(context) {
  for (const pattern of FIREBASE_API_PATTERNS) {
    await context.route(pattern, async (route) => {
      const request = route.request();
      const method = request.method();

      // Let OPTIONS preflight through with permissive headers
      if (method === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600',
          },
        });
        return;
      }

      // Proxy the actual request through Node.js fetch
      try {
        const url = request.url();
        const headers = await request.allHeaders();
        const postData = request.postData();

        // Remove browser-specific headers that could cause issues
        delete headers['origin'];
        delete headers['referer'];
        delete headers['sec-fetch-dest'];
        delete headers['sec-fetch-mode'];
        delete headers['sec-fetch-site'];

        const fetchOptions = {
          method,
          headers,
          ...(postData && { body: postData }),
        };

        const response = await fetch(url, fetchOptions);
        const body = await response.text();

        // Build response headers, adding CORS
        const responseHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': response.headers.get('content-type') || 'application/json',
        };

        await route.fulfill({
          status: response.status,
          headers: responseHeaders,
          body,
        });
      } catch (err) {
        console.error(`[firebase-proxy] Failed to proxy ${method} ${request.url()}: ${err.message}`);
        await route.abort('connectionfailed');
      }
    });
  }
}
