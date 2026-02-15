import { describe, it, expect } from 'vitest';
import { formatResponse } from './formatResponse.js';

describe('formatResponse', () => {
  it('returns default shape when called with no arguments', () => {
    expect(formatResponse()).toEqual({ data: null, error: null, message: '' });
  });

  it('includes provided data and message', () => {
    const result = formatResponse({ id: 1 }, 'ok');
    expect(result).toEqual({ data: { id: 1 }, error: null, message: 'ok' });
  });

  it('includes error when provided', () => {
    const result = formatResponse(null, 'fail', 'Something went wrong');
    expect(result.error).toBe('Something went wrong');
  });
});
