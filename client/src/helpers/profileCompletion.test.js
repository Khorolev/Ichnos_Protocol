import { describe, it, expect, beforeEach } from 'vitest';
import {
  isCompletionRequired,
  markCompletionShown,
  wasCompletionShown,
  clearCompletionShown,
} from './profileCompletion';

describe('isCompletionRequired', () => {
  it('returns true when profile is incomplete', () => {
    expect(isCompletionRequired({ isProfileComplete: false })).toBe(true);
  });

  it('returns false when profile is complete', () => {
    expect(isCompletionRequired({ isProfileComplete: true })).toBe(false);
  });

  it('returns false for null profileState', () => {
    expect(isCompletionRequired(null)).toBe(false);
  });

  it('returns false for undefined profileState', () => {
    expect(isCompletionRequired(undefined)).toBe(false);
  });

  it('returns false when isProfileComplete is missing', () => {
    expect(isCompletionRequired({})).toBe(false);
  });
});

describe('session tracking', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('wasCompletionShown returns false initially', () => {
    expect(wasCompletionShown()).toBe(false);
  });

  it('markCompletionShown sets the flag', () => {
    markCompletionShown();
    expect(wasCompletionShown()).toBe(true);
  });

  it('clearCompletionShown removes the flag', () => {
    markCompletionShown();
    clearCompletionShown();
    expect(wasCompletionShown()).toBe(false);
  });
});
