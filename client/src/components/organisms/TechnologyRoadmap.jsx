import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';

import {
  ROADMAP_PHASES,
  TECHNOLOGY_ROADMAP_CONTENT,
} from '../../constants/services';

const badgeClass = (badge) =>
  badge === 'CURRENT' ? 'badge-roadmap-current' : 'badge-roadmap-planned';

const PhaseCard = ({ title, badge, description, features }) => (
  <Col xs={12} md={6} className="mb-4">
    <Card className="h-100 roadmap-card">
      <Card.Body>
        <div className="mb-3">
          <Badge bg="" className={badgeClass(badge)}>{badge}</Badge>
        </div>
        <Card.Title className="h5 mb-3 roadmap-card-title">{title}</Card.Title>
        <Card.Text className="mb-3 roadmap-card-text">{description}</Card.Text>
        <ul className="list-unstyled mb-0">
          {features.map((feat) => (
            <li key={feat} className="mb-1 small roadmap-card-detail">
              <span className="me-2 text-accent">&#8226;</span>
              {feat}
            </li>
          ))}
        </ul>
      </Card.Body>
    </Card>
  </Col>
);

export default function TechnologyRoadmap() {
  return (
    <section className="py-5">
      <h2 className="text-center mb-2 section-heading">
        {TECHNOLOGY_ROADMAP_CONTENT.heading}
      </h2>
      <p className="text-center mb-5 section-subtext">
        {TECHNOLOGY_ROADMAP_CONTENT.subtext}
      </p>
      <Row>
        {ROADMAP_PHASES.map(({ id, title, badge, description, features }) => (
          <PhaseCard
            key={id}
            title={title}
            badge={badge}
            description={description}
            features={features}
          />
        ))}
      </Row>
      <p className="text-center mt-3 small section-subtext">
        {TECHNOLOGY_ROADMAP_CONTENT.footer}
      </p>
    </section>
  );
}
