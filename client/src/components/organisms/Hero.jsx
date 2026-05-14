import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { HERO_CONTENT } from '../../constants/landingContent';

export default function Hero() {
  return (
    <section className="hero-section hero-section--advisory full-bleed-section d-flex align-items-center">
      <Container>
        <Row className="justify-content-center text-center">
          <Col lg={8} md={10}>
            <p className="text-uppercase small fw-semibold text-muted-custom mb-3 hero-eyebrow">
              {HERO_CONTENT.eyebrow}
            </p>
            <h1 className="display-4 fw-bold mb-4 hero-headline">
              {HERO_CONTENT.tagline}
            </h1>
            <p className="lead mb-5 text-muted-custom">
              {HERO_CONTENT.subhead}
            </p>
            <Link
              to={HERO_CONTENT.ctaHref}
              className="btn btn-lg px-5 py-3 fw-semibold hero-cta-btn"
            >
              {HERO_CONTENT.ctaText}
            </Link>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
