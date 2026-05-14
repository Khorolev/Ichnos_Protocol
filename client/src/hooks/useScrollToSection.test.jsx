import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { scroller } from 'react-scroll';
import { useScrollToSection } from './useScrollToSection';

vi.mock('react-scroll', () => ({
  scroller: { scrollTo: vi.fn() },
}));

vi.mock('./useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from './useReducedMotion';

function wrapper({ initialEntries }) {
  return function Wrapper({ children }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  };
}

function mountTarget(id) {
  const el = document.createElement('div');
  el.id = id;
  document.body.appendChild(el);
  return el;
}

function mountNameTarget(name) {
  const el = document.createElement('div');
  el.setAttribute('name', name);
  document.body.appendChild(el);
  return el;
}

function flushRaf() {
  return act(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => resolve());
      }),
  );
}

describe('useScrollToSection', () => {
  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('scrolls to section when location.state.scrollTo is present and target exists', () => {
    mountTarget('problem');
    const entries = [{ pathname: '/', state: { scrollTo: 'problem' } }];
    renderHook(() => useScrollToSection(), {
      wrapper: wrapper({ initialEntries: entries }),
    });

    expect(scroller.scrollTo).toHaveBeenCalledWith('problem', expect.objectContaining({
      smooth: true,
      duration: 500,
      offset: -80,
    }));
  });

  it('uses smooth scroll (duration 500) when reducedMotion is false', () => {
    mountTarget('solution');
    useReducedMotion.mockReturnValue(false);
    const entries = [{ pathname: '/', state: { scrollTo: 'solution' } }];
    renderHook(() => useScrollToSection(), {
      wrapper: wrapper({ initialEntries: entries }),
    });

    expect(scroller.scrollTo).toHaveBeenCalledWith('solution', expect.objectContaining({
      smooth: true,
      duration: 500,
    }));
  });

  it('uses instant scroll (duration 0) when reducedMotion is true', () => {
    mountTarget('services');
    useReducedMotion.mockReturnValue(true);
    const entries = [{ pathname: '/', state: { scrollTo: 'services' } }];
    renderHook(() => useScrollToSection(), {
      wrapper: wrapper({ initialEntries: entries }),
    });

    expect(scroller.scrollTo).toHaveBeenCalledWith('services', expect.objectContaining({
      smooth: false,
      duration: 0,
    }));
  });

  it('does not scroll when scrollTo state is missing', () => {
    const entries = [{ pathname: '/', state: {} }];
    renderHook(() => useScrollToSection(), {
      wrapper: wrapper({ initialEntries: entries }),
    });

    expect(scroller.scrollTo).not.toHaveBeenCalled();
  });

  it('handles missing state gracefully', () => {
    const entries = ['/'];
    renderHook(() => useScrollToSection(), {
      wrapper: wrapper({ initialEntries: entries }),
    });

    expect(scroller.scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls to react-scroll name-only target (e.g., services) without requiring matching id', async () => {
    useReducedMotion.mockReturnValue(false);
    const entries = [{ pathname: '/', state: { scrollTo: 'services' } }];
    renderHook(() => useScrollToSection(), {
      wrapper: wrapper({ initialEntries: entries }),
    });

    expect(scroller.scrollTo).not.toHaveBeenCalled();

    await flushRaf();
    expect(scroller.scrollTo).not.toHaveBeenCalled();

    mountNameTarget('services');
    await flushRaf();

    expect(scroller.scrollTo).toHaveBeenCalledWith('services', expect.objectContaining({
      smooth: true,
      duration: 500,
      offset: -80,
    }));
  });

  it('does not scroll or clear state when target is not yet mounted (reducedMotion=false)', async () => {
    useReducedMotion.mockReturnValue(false);
    const entries = [{ pathname: '/', state: { scrollTo: 'company' } }];
    renderHook(() => useScrollToSection(), {
      wrapper: wrapper({ initialEntries: entries }),
    });

    expect(scroller.scrollTo).not.toHaveBeenCalled();

    await flushRaf();
    expect(scroller.scrollTo).not.toHaveBeenCalled();

    mountTarget('company');
    await flushRaf();

    expect(scroller.scrollTo).toHaveBeenCalledWith('company', expect.objectContaining({
      smooth: true,
      duration: 500,
      offset: -80,
    }));
  });
});
