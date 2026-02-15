import { useState, useEffect } from 'react';

import { useReducedMotion } from '../../hooks/useReducedMotion';

export default function PageTransition({ children, skeleton }) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState(reducedMotion ? 'ready' : 'enter');

  useEffect(() => {
    if (reducedMotion) return;
    const id = requestAnimationFrame(() => setPhase('active'));
    return () => cancelAnimationFrame(id);
  }, [reducedMotion]);

  if (phase === 'enter' && skeleton) {
    return <div className="page-fade-enter">{skeleton}</div>;
  }

  if (reducedMotion) {
    return <div className="page-fade-skip">{children}</div>;
  }

  const className = phase === 'active'
    ? 'page-fade-enter-active'
    : 'page-fade-enter';

  return <div className={className}>{children}</div>;
}
