import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Placeholder from 'react-bootstrap/Placeholder';

export default function HeroSkeleton() {
  return (
    <section
      className="hero-section d-flex align-items-center"
      aria-hidden="true"
    >
      <Container>
        <Row className="justify-content-center text-center">
          <Col lg={8} md={10}>
            <Placeholder as="h1" animation="glow" className="display-4 mb-4">
              <Placeholder xs={8} bg="secondary" />
            </Placeholder>
            <Placeholder as="p" animation="glow" className="lead mb-5">
              <Placeholder xs={10} bg="secondary" />
              <Placeholder xs={6} bg="secondary" />
            </Placeholder>
            <Placeholder.Button
              variant="secondary"
              xs={3}
              className="btn-lg px-5 py-3"
            />
          </Col>
        </Row>
      </Container>
    </section>
  );
}
