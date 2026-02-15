import { Link as ScrollLink } from 'react-scroll';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { HERO_CONTENT } from '../../constants/landingContent';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const SCROLL_OFFSET = -80;
const SCROLL_DURATION = 500;

export default function Hero() {
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : SCROLL_DURATION;

  return (
    <section className="hero-section d-flex align-items-center">
      <Container>
        <Row className="justify-content-center text-center">
          <Col lg={8} md={10}>
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
          </Col>
        </Row>
      </Container>
    </section>
  );
}
