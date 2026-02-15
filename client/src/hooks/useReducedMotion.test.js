import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from './useReducedMotion';

function mockMatchMedia(matches) {
  const listeners = [];
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn((_, handler) => listeners.push(handler)),
    removeEventListener: vi.fn((_, handler) => {
      const idx = listeners.indexOf(handler);
      if (idx !== -1) listeners.splice(idx, 1);
    }),
  };

  window.matchMedia = vi.fn().mockReturnValue(mql);
  return { mql, listeners };
}

describe('useReducedMotion', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns false when prefers-reduced-motion is not set', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when prefers-reduced-motion: reduce is active', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates state when media query changes', () => {
    const { listeners } = mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      listeners.forEach((fn) => fn({ matches: true }));
    });

    expect(result.current).toBe(true);
  });

  it('removes event listener on unmount', () => {
    const { mql } = mockMatchMedia(false);
    const { unmount } = renderHook(() => useReducedMotion());

    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
