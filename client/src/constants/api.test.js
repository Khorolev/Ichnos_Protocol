import { describe, it, expect } from 'vitest';

import { API_BASE_URL, API_HEALTH_PATH, API_SANITY_TIMEOUT_MS } from './api';

describe('API constants', () => {
  it('API_BASE_URL is always empty string (same-origin /api/*)', () => {
    expect(API_BASE_URL).toBe('');
  });

  it('API_HEALTH_PATH equals /api/health', () => {
    expect(API_HEALTH_PATH).toBe('/api/health');
  });

  it('API_SANITY_TIMEOUT_MS is a positive number', () => {
    expect(API_SANITY_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
