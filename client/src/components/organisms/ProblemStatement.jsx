import { Element } from 'react-scroll';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { PROBLEM_CARDS } from '../../constants/landingContent';

export default function ProblemStatement() {
  return (
    <Element name="problem">
      <section className="py-5">
        <Container>
          <h2 className="text-center fw-bold mb-5">
            The Battery Regulation Challenge
          </h2>
          <Row className="g-4">
            {PROBLEM_CARDS.map(({ title, description, icon }) => (
              <Col key={title} md={4}>
                <div className="problem-card h-100 rounded-3 p-4 text-center">
                  <i className={`bi ${icon} fs-1 mb-3 d-block`} aria-hidden="true" />
                  <h3 className="h5 fw-semibold mb-3">{title}</h3>
                  <p className="mb-0">{description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </Element>
  );
}
