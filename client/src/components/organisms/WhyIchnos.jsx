import { Element } from 'react-scroll';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { WHY_ICHNOS_CARDS } from '../../constants/landingContent';

export default function WhyIchnos() {
  return (
    <Element name="why-ichnos">
      <section className="py-5">
        <Container>
          <h2 className="text-center fw-bold mb-5">Why Ichnos Protocol</h2>
          <Row className="g-4">
            {WHY_ICHNOS_CARDS.map(({ title, description, icon }) => (
              <Col key={title} sm={6} md={3}>
                <div className="why-card text-center p-4 h-100">
                  <div className="why-card-icon mx-auto mb-3">
                    <i className={`bi ${icon} fs-3`} aria-hidden="true" />
                  </div>
                  <h4 className="h6 fw-semibold mb-2">{title}</h4>
                  <p className="small mb-0">{description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </Element>
  );
}
