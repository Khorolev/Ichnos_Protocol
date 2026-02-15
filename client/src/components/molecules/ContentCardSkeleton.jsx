import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Placeholder from 'react-bootstrap/Placeholder';

export default function ContentCardSkeleton({ count = 3 }) {
  return (
    <Row className="g-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Col md={4} key={i}>
          <Card className="service-card h-100 border-0 rounded-3 p-3">
            <Card.Body>
              <Placeholder as={Card.Title} animation="glow">
                <Placeholder xs={6} bg="secondary" />
              </Placeholder>
              <Placeholder as={Card.Text} animation="glow">
                <Placeholder xs={12} bg="secondary" />
                <Placeholder xs={8} bg="secondary" />
                <Placeholder xs={10} bg="secondary" />
              </Placeholder>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
