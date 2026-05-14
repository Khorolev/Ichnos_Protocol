import { Element } from 'react-scroll';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';

import Icon from '../atoms/Icon';

const COMPANY_DIFFERENTIATORS = [
  { icon: 'mortarboard', label: 'PhD-level circular-economy depth' },
  { icon: 'globe-asia-australia', label: 'EU regulation, APAC supply chains' },
  { icon: 'tools', label: 'Practitioner-led' },
];

export default function CompanySnapshot() {
  return (
    <Element name="company">
      <section
        id="company"
        className="py-5 section-rhythm-alt"
        data-testid="company-snapshot"
      >
        <Container>
          <h2 className="text-center fw-bold mb-3">Why Ichnos</h2>
          <p
            className="text-center lead mx-auto mb-4 company-snapshot-lead"
            data-testid="company-snapshot-paragraph"
          >
            Ichnos Protocol helps OEMs, Tier-1 suppliers, and recyclers build battery systems and battery passports that work in production — not just on paper. We bring practitioner-led depth across systems engineering, safety, mechanical development, remanufacturing, and EU/APAC compliance — so your program clears the regulation and survives the factory floor.
          </p>
          <Row className="g-4 justify-content-center">
            {COMPANY_DIFFERENTIATORS.map(({ icon, label }) => (
              <Col key={label} md={4}>
                <Card className="h-100 text-center">
                  <Card.Body>
                    <Icon name={icon} className="fs-1 mb-3 d-block text-accent" />
                    <h3 className="h6 fw-semibold mb-0">{label}</h3>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          <div className="text-center mt-4">
            <Link to="/team" className="fw-semibold">
              Meet the team →
            </Link>
          </div>
        </Container>
      </section>
    </Element>
  );
}
