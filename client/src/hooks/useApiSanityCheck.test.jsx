import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { useApiSanityCheck } from './useApiSanityCheck';

vi.mock('../helpers/apiHealthCheck');

describe('useApiSanityCheck', () => {
  let checkApiHealth;

  beforeEach(async () => {
    const mod = await import('../helpers/apiHealthCheck');
    checkApiHealth = mod.checkApiHealth;
  });

  it('returns no warning on successful check', async () => {
    checkApiHealth.mockResolvedValue({ ok: true, warning: null });

    const { result } = renderHook(() => useApiSanityCheck());

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.warning).toBeNull();
  });

  it('returns warning on failed check', async () => {
    checkApiHealth.mockResolvedValue({
      ok: false,
      warning: 'test warning',
    });

    const { result } = renderHook(() => useApiSanityCheck());

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.warning).toBe('test warning');
  });

  it('starts with isChecking true', () => {
    checkApiHealth.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useApiSanityCheck());

    expect(result.current.isChecking).toBe(true);
    expect(result.current.warning).toBeNull();
  });
});
