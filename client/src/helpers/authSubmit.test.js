import { describe, it, expect } from 'vitest';

import {
  buildSignupSyncPayload,
  buildCompletionSyncPayload,
} from './authSubmit.js';

describe('buildSignupSyncPayload', () => {
  it('maps all profile fields without firebaseUid', () => {
    const signupFields = {
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
      company: 'Acme',
      phone: '+123456789',
      linkedin: 'https://linkedin.com/in/johndoe',
    };

    const payload = buildSignupSyncPayload(signupFields);

    expect(payload).toEqual({
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
      company: 'Acme',
      phone: '+123456789',
      linkedin: 'https://linkedin.com/in/johndoe',
    });
  });

  it('coerces empty optional fields to undefined', () => {
    const signupFields = {
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
      company: '',
      phone: '',
      linkedin: '',
    };

    const payload = buildSignupSyncPayload(signupFields);

    expect(payload.company).toBeUndefined();
    expect(payload.phone).toBeUndefined();
    expect(payload.linkedin).toBeUndefined();
    expect(payload.email).toBe('john@example.com');
    expect(payload.name).toBe('John');
    expect(payload.surname).toBe('Doe');
  });

  it('does not include a firebaseUid key', () => {
    const signupFields = {
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
      company: 'Acme',
      phone: '+123456789',
      linkedin: 'https://linkedin.com/in/johndoe',
    };

    const payload = buildSignupSyncPayload(signupFields);

    expect(payload).not.toHaveProperty('firebaseUid');
  });
});

describe('buildCompletionSyncPayload', () => {
  const canonicalEmail = 'john@example.com';
  const fields = { name: 'John', surname: 'Doe' };

  it('always sets email from canonicalEmail parameter', () => {
    const payload = buildCompletionSyncPayload(
      'canonical@example.com',
      fields,
    );

    expect(payload.email).toBe('canonical@example.com');
  });

  it('always sets name and surname from fields parameter', () => {
    const payload = buildCompletionSyncPayload(canonicalEmail, {
      name: 'Jane',
      surname: 'Smith',
    });

    expect(payload.name).toBe('Jane');
    expect(payload.surname).toBe('Smith');
  });

  it('does not include a firebaseUid key', () => {
    const payload = buildCompletionSyncPayload(canonicalEmail, fields);

    expect(payload).not.toHaveProperty('firebaseUid');
  });

  it('returns only email, name, and surname', () => {
    const payload = buildCompletionSyncPayload(canonicalEmail, fields);

    expect(payload).toEqual({
      email: 'john@example.com',
      name: 'John',
      surname: 'Doe',
    });
  });
});
