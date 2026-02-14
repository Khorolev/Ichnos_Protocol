import { Link } from 'react-router-dom';

export default function ServiceCard({ title, description, linkTo = '/services' }) {
  return (
    <div className="card service-card h-100 border-0">
      <div className="card-body d-flex flex-column p-4">
        <h5 className="card-title mb-3">{title}</h5>
        <p className="card-text flex-grow-1 mb-3">{description}</p>
        <Link to={linkTo} className="mt-auto fw-semibold text-decoration-none">
          Learn More &rarr;
        </Link>
      </div>
    </div>
  );
}
