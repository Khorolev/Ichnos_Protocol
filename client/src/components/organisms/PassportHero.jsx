import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";

import Logo from "../atoms/Logo";
import { PASSPORT_PAGE_CONTENT } from "../../constants/passportContent";

export default function PassportHero() {
  const { productMark, title, subtitle, statusBadge } = PASSPORT_PAGE_CONTENT;

  return (
    <section
      className="passport-hero hero-section full-bleed-section d-flex align-items-center"
      data-testid="passport-hero"
    >
      <Container>
        <Row className="justify-content-center text-center">
          <Col lg={8} md={10}>
            <Logo theme="passport" className="mb-4 mw-100" />
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
