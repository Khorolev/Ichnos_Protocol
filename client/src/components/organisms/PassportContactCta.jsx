import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import Button from "../atoms/Button";
import { PASSPORT_CONTACT_CTA } from "../../constants/passportContent";

export default function PassportContactCta() {
  const { heading, body, ctaLabel, ctaPath } = PASSPORT_CONTACT_CTA;

  return (
    <section
      id="passport-contact"
      className="py-5"
      data-testid="passport-contact-cta"
    >
      <Container>
        <Row className="justify-content-center text-center">
          <Col lg={8} md={10}>
            <h2 className="mb-3 section-heading">{heading}</h2>
            <p className="lead mb-4">{body}</p>
            <Button as={Link} to={ctaPath} variant="primary">
              {ctaLabel}
            </Button>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
