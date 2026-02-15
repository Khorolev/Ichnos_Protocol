import { Element } from 'react-scroll';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { SOLUTION_CONTENT } from '../../constants/landingContent';

export default function SolutionOverview() {
  return (
    <Element name="solution">
      <section className="solution-section py-5">
        <Container>
          <h2 className="text-center fw-bold mb-5">
            {SOLUTION_CONTENT.heading}
          </h2>
          <Row className="align-items-center g-4">
            <Col md={6}>
              <p className="fs-5 mb-0">{SOLUTION_CONTENT.description}</p>
            </Col>
            <Col md={6}>
              <ul className="list-unstyled mb-0">
                {SOLUTION_CONTENT.features.map((feature) => (
                  <li key={feature} className="d-flex align-items-start mb-3">
                    <i
                      className="bi bi-check-circle-fill me-3 mt-1 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Col>
          </Row>
        </Container>
      </section>
    </Element>
  );
}
