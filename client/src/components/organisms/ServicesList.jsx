import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

import { SERVICES_LIST, SERVICES_LIST_CONTENT } from '../../constants/services';

const ServiceCard = ({ title, description, details }) => (
  <Col xs={12} md={6} lg={4} className="mb-4">
    <Card className="h-100 service-card">
      <Card.Body>
        <Card.Title className="h5 mb-3 service-card-title">{title}</Card.Title>
        <Card.Text className="mb-3 service-card-text">{description}</Card.Text>
        <ul className="list-unstyled mb-0">
          {details.map((detail) => (
            <li key={detail} className="mb-1 small service-card-detail">
              <span className="me-2 text-accent">&#10003;</span>
              {detail}
            </li>
          ))}
        </ul>
      </Card.Body>
    </Card>
  </Col>
);

export default function ServicesList() {
  return (
    <section className="py-5">
      <h2 className="text-center mb-2 section-heading">
        {SERVICES_LIST_CONTENT.heading}
      </h2>
      <p className="text-center mb-5 section-subtext">
        {SERVICES_LIST_CONTENT.subtext}
      </p>
      <Row>
        {SERVICES_LIST.map(({ id, title, description, details }) => (
          <ServiceCard
            key={id}
            title={title}
            description={description}
            details={details}
          />
        ))}
      </Row>
    </section>
  );
}
