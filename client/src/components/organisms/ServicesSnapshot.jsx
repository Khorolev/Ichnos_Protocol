import { Element } from 'react-scroll';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { SERVICES_PREVIEW } from '../../constants/landingContent';
import ServiceCard from '../molecules/ServiceCard';

export default function ServicesSnapshot() {
  return (
    <Element name="services">
      <section className="py-5">
        <Container>
          <h2 className="text-center fw-bold mb-5">Our Services</h2>
          <Row className="g-4">
            {SERVICES_PREVIEW.map(({ id, title, description }) => (
              <Col key={id} md={4}>
                <ServiceCard title={title} description={description} />
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </Element>
  );
}
