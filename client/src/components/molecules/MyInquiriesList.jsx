import ListGroup from 'react-bootstrap/ListGroup';

import InquiryStatusBadge from '../atoms/InquiryStatusBadge';
import Button from '../atoms/Button';

function truncate(text, max = 80) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function MyInquiriesList({ requests, onAddQuestion, onNewInquiry }) {
  return (
    <section className="mb-4">
      <h2 className="h5 mb-3">My Inquiries</h2>
      <ListGroup className="mb-3">
        {requests.map((req) => (
          <ListGroup.Item
            key={req.id}
            className="d-flex justify-content-between align-items-start"
          >
            <div>
              <InquiryStatusBadge status={req.status} />
              <span className="ms-2">
                {truncate(req.questions?.[0]?.question || req.questions?.[0]?.text || req.question_preview)}
              </span>
              <small className="text-muted d-block mt-1">
                {formatDate(req.created_at)}
              </small>
            </div>
            <Button size="sm" variant="outline-secondary" onClick={() => onAddQuestion(req.id)}>
              Add question
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Button variant="outline-primary" onClick={onNewInquiry}>
        Submit new inquiry
      </Button>
    </section>
  );
}
