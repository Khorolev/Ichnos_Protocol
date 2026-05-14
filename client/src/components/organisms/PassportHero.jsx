import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";

import { PASSPORT_PAGE_CONTENT } from "../../constants/passportContent";

export default function PassportHero() {
  const { productMark, title, subtitle, dualStandardParagraph, statusBadge } =
    PASSPORT_PAGE_CONTENT;

  return (
    <section
      className="passport-hero hero-section full-bleed-section d-flex align-items-center"
      data-testid="passport-hero"
    >
      <Container>
        <Row className="justify-content-center text-center">
          <Col lg={8} md={10}>
            <img
              src="/logo-legacy.png"
              alt="Ichnos Protocol Battery Passport"
              className="passport-hero-mark mb-4 mw-100"
              data-testid="passport-legacy-mark"
            />
            <p
              className="small text-uppercase text-muted-custom mb-3"
              data-testid="passport-product-mark"
            >
              {productMark}
            </p>
            <h1 className="display-4 fw-bold mb-4 page-title">
              <span className="gradient-text">{title}</span>
            </h1>
            <p className="lead section-subtext mb-4">{subtitle}</p>
            <p
              className="section-subtext mb-4"
              data-testid="passport-dual-standard"
            >
              {dualStandardParagraph}
            </p>
            <Badge
              bg=""
              className="badge-status-live"
              data-testid="passport-status"
            >
              {statusBadge}
            </Badge>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
