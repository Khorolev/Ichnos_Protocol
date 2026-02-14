import { Link as ScrollLink } from 'react-scroll';

import { HERO_CONTENT } from '../../constants/landingContent';

const SCROLL_OFFSET = -80;
const SCROLL_DURATION = 500;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Hero() {
  const duration = prefersReducedMotion() ? 0 : SCROLL_DURATION;

  return (
    <section className="hero-section d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center text-center">
          <div className="col-lg-8 col-md-10">
            <h1 className="display-4 fw-bold mb-4">
              <span className="gradient-text">{HERO_CONTENT.tagline}</span>
            </h1>
            <p className="lead mb-5 text-muted-custom">
              {HERO_CONTENT.subtitle}
            </p>
            <ScrollLink
              to="services"
              smooth={duration > 0}
              duration={duration}
              offset={SCROLL_OFFSET}
              className="btn btn-lg px-5 py-3 fw-semibold hero-cta-btn"
              role="button"
              tabIndex={0}
              aria-label="Scroll to services section"
            >
              {HERO_CONTENT.ctaText}
            </ScrollLink>
          </div>
        </div>
      </div>
    </section>
  );
}
