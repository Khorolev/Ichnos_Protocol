import { describe, it, expect } from 'vitest';
import { formatFirebaseError } from './firebaseErrors';

describe('formatFirebaseError', () => {
  it('returns message for known error code', () => {
    expect(formatFirebaseError({ code: 'auth/invalid-credential' }))
      .toBe('Invalid email or password.');
  });

  it('returns message for email-already-in-use', () => {
    expect(formatFirebaseError({ code: 'auth/email-already-in-use' }))
      .toBe('An account with this email already exists.');
  });

  it('returns fallback for unknown error code', () => {
    expect(formatFirebaseError({ code: 'auth/unknown' }))
      .toBe('An unexpected error occurred.');
  });

  it('returns fallback for null error', () => {
    expect(formatFirebaseError(null))
      .toBe('An unexpected error occurred.');
  });
});
