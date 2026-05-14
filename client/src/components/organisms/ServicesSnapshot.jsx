import { Link } from 'react-router-dom';
import { Element } from 'react-scroll';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

import { SERVICES_LIST } from '../../constants/services';

const SnapshotCard = ({ icon, title, tagline }) => (
  <Card className="h-100 service-card">
    <Card.Body>
      <i className={`bi ${icon} fs-2 mb-3 text-accent d-block`} aria-hidden="true" />
      <h3 className="h5 mb-2 service-card-title">{title}</h3>
      <p className="mb-0 service-card-text">{tagline}</p>
    </Card.Body>
  </Card>
);

export default function ServicesSnapshot() {
  return (
    <Element name="services">
      <section className="py-5">
        <Container>
          <h2 className="text-center fw-bold mb-5">Our Services</h2>
          <Row className="g-4">
            {SERVICES_LIST.map(({ id, icon, title, tagline }) => (
              <Col key={id} md={6} lg={4}>
                <SnapshotCard icon={icon} title={title} tagline={tagline} />
              </Col>
            ))}
          </Row>
          <div className="text-center mt-4">
            <Link
              to="/services"
              className="fw-semibold"
              data-testid="services-snapshot-cta"
            >
              See full services →
            </Link>
          </div>
        </Container>
      </section>
    </Element>
  );
}
