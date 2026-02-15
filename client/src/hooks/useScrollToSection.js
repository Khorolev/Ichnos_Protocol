import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { scroller } from 'react-scroll';

import { useReducedMotion } from './useReducedMotion';

const SCROLL_OFFSET = -80;
const SCROLL_DURATION = 500;

export const useScrollToSection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const sectionId = location.state?.scrollTo;
    if (!sectionId) return;

    const duration = reducedMotion ? 0 : SCROLL_DURATION;

    scroller.scrollTo(sectionId, {
      smooth: duration > 0,
      duration,
      offset: SCROLL_OFFSET,
    });

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, navigate, location.pathname, reducedMotion]);
};
