import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';

export default function ServiceCard({ title, description, linkTo = '/services' }) {
  return (
    <Card className="service-card h-100 border-0">
      <Card.Body className="d-flex flex-column p-4">
        <Card.Title className="mb-3">{title}</Card.Title>
        <Card.Text className="flex-grow-1 mb-3">{description}</Card.Text>
        <Link to={linkTo} className="mt-auto fw-semibold text-decoration-none">
          Learn More &rarr;
        </Link>
      </Card.Body>
    </Card>
  );
}
