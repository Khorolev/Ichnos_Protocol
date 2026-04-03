import { describe, it, expect } from 'vitest';
import { formatFirebaseError, formatSyncError } from './firebaseErrors';

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

describe('formatSyncError', () => {
  it('returns network message for FETCH_ERROR', () => {
    expect(formatSyncError({ status: 'FETCH_ERROR' }))
      .toBe('Unable to reach the server. Please try again.');
  });

  it('returns network message for TIMEOUT_ERROR', () => {
    expect(formatSyncError({ status: 'TIMEOUT_ERROR' }))
      .toBe('Unable to reach the server. Please try again.');
  });

  it('returns server error message for 500 status', () => {
    expect(formatSyncError({ status: 500 }))
      .toBe('An unexpected server error occurred.');
  });

  it('returns server error message for 502 status', () => {
    expect(formatSyncError({ status: 502 }))
      .toBe('An unexpected server error occurred.');
  });

  it('returns generic fallback for 400 status', () => {
    expect(formatSyncError({ status: 400 }))
      .toBe('An unexpected error occurred.');
  });

  it('returns generic fallback for null error', () => {
    expect(formatSyncError(null))
      .toBe('An unexpected error occurred.');
  });

  it('returns generic fallback for undefined error', () => {
    expect(formatSyncError(undefined))
      .toBe('An unexpected error occurred.');
  });
});
