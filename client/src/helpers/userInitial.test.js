import { describe, it, expect } from 'vitest';
import { getUserInitial, getUserDisplayName } from './userInitial';

describe('getUserInitial', () => {
  it('returns first letter of name uppercased', () => {
    expect(getUserInitial({ name: 'john', email: 'j@x.com' })).toBe('J');
  });

  it('returns first letter of email when no name', () => {
    expect(getUserInitial({ email: 'alice@x.com' })).toBe('A');
  });

  it('returns ? for null user', () => {
    expect(getUserInitial(null)).toBe('?');
  });
});

describe('getUserDisplayName', () => {
  it('returns name when available', () => {
    expect(getUserDisplayName({ name: 'John', email: 'j@x.com' })).toBe('John');
  });

  it('returns email prefix when no name', () => {
    expect(getUserDisplayName({ email: 'alice@x.com' })).toBe('alice');
  });

  it('returns User for null', () => {
    expect(getUserDisplayName(null)).toBe('User');
  });
});
