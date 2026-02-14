import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { scroller } from 'react-scroll';

const SCROLL_OFFSET = -80;
const SCROLL_DURATION = 500;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useScrollToSection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const sectionId = location.state?.scrollTo;
    if (!sectionId) return;

    const duration = prefersReducedMotion() ? 0 : SCROLL_DURATION;

    scroller.scrollTo(sectionId, {
      smooth: duration > 0,
      duration,
      offset: SCROLL_OFFSET,
    });

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, navigate, location.pathname]);
};
