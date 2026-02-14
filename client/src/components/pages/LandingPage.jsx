import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Element, scroller } from 'react-scroll';

import { LANDING_SECTIONS } from '../../constants/navigation';

const SCROLL_OFFSET = -80;
const SCROLL_DURATION = 500;

const LandingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const sectionId = location.state?.scrollTo;
    if (!sectionId) return;

    scroller.scrollTo(sectionId, {
      smooth: true,
      duration: SCROLL_DURATION,
      offset: SCROLL_OFFSET,
    });

    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, navigate, location.pathname]);

  return (
    <div>
      <h1>Landing Page</h1>
      {LANDING_SECTIONS.map(({ label, sectionId }) => (
        <Element key={sectionId} name={sectionId}>
          <section id={sectionId} className="py-5 landing-section">
            <h2>{label}</h2>
            <p>Content coming soon.</p>
          </section>
        </Element>
      ))}
    </div>
  );
};

export default LandingPage;
