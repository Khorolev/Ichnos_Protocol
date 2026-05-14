import { Element } from 'react-scroll';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';

const PASSPORT_TEASER_HEADING = 'Battery Passport';
const PASSPORT_TEASER_BODY =
  'Beyond advisory, Ichnos Protocol is building a digital Battery Passport platform aligned with EU Regulation 2023/1542 and Malaysian MS 2818. Compliant data foundations for OEMs exporting between Europe and ASEAN — designed for two regulatory homes from day one.';
const PASSPORT_TEASER_CTA = 'Explore the Battery Passport →';

export default function PassportTeaser() {
  return (
    <Element name="passport">
      <section
        id="passport"
        className="py-5"
        data-testid="passport-teaser"
      >
        <Container>
          <Row className="justify-content-center">
            <Col lg={8} md={10}>
              <Card
                bg="dark"
                text="white"
                className="passport-teaser-card border-0 shadow"
              >
                <Card.Body>
                  <h2 className="h3 mb-3">{PASSPORT_TEASER_HEADING}</h2>
                  <p className="mb-4">{PASSPORT_TEASER_BODY}</p>
                  <Link to="/passport" className="fw-semibold link-light">
                    {PASSPORT_TEASER_CTA}
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </Element>
  );
}
