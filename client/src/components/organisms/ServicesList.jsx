import { Link } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

import { SERVICES_LIST } from '../../constants/services';

const ServiceCard = ({ icon, title, tagline, description, passportLink }) => (
  <Col xs={12} md={6} lg={4} className="mb-4">
    <Card className="h-100 service-card">
      <Card.Body>
        <i className={`bi ${icon} fs-2 mb-3 text-accent d-block`} aria-hidden="true" />
        <Card.Title className="h5 mb-2 service-card-title">{title}</Card.Title>
        <p className="text-muted small mb-3">{tagline}</p>
        <Card.Text className="service-card-text">{description}</Card.Text>
        {passportLink && (
          <Link
            to={passportLink}
            className="mt-3 d-inline-block fw-semibold text-decoration-none"
          >
            Learn more →
          </Link>
        )}
      </Card.Body>
    </Card>
  </Col>
);

export default function ServicesList() {
  return (
    <section className="py-5">
      <Row>
        {SERVICES_LIST.map((service) => (
          <ServiceCard key={service.id} {...service} />
        ))}
      </Row>
    </section>
  );
}
