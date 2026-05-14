import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { scroller } from 'react-scroll';

import { useReducedMotion } from './useReducedMotion';

const SCROLL_OFFSET = -80;
const SCROLL_DURATION = 500;
const MAX_RETRY_ATTEMPTS = 60;

const isTargetReady = (sectionId) => {
  if (typeof document === 'undefined') return false;
  if (document.getElementById(sectionId) !== null) return true;
  return document.querySelector(`[name="${CSS.escape(sectionId)}"]`) !== null;
};

export const useScrollToSection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const sectionId = location.state?.scrollTo;
    if (!sectionId) return;

    let cancelled = false;
    let rafId = null;
    let attempts = 0;
    const duration = reducedMotion ? 0 : SCROLL_DURATION;

    const attemptScroll = () => {
      if (cancelled) return;
      if (isTargetReady(sectionId)) {
        scroller.scrollTo(sectionId, {
          smooth: duration > 0,
          duration,
          offset: SCROLL_OFFSET,
        });
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }
      attempts += 1;
      if (attempts >= MAX_RETRY_ATTEMPTS) return;
      rafId = requestAnimationFrame(attemptScroll);
    };

    attemptScroll();

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [location.state, navigate, location.pathname, reducedMotion]);
};
