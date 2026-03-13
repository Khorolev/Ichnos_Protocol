import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

import InquiryStatusBadge from '../atoms/InquiryStatusBadge';

const STATUSES = ['new', 'contacted', 'in_progress', 'resolved'];

function truncate(text, max = 100) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

function getPreviewText(request) {
  return request.questionPreview || request.question_preview || '';
}

export default function KanbanLane({
  user,
  isExpanded,
  onToggle,
  onSelectUser,
  requests,
  isLoading,
}) {
  return (
    <div className="border-bottom py-2">
      <Row className="align-items-center">
        <Col
          role="button"
          className="cursor-pointer"
          onClick={() => onSelectUser(user.userId)}
        >
          <span className="fw-bold">{user.name}</span>
          <span className="text-muted ms-2">{user.email}</span>
          {user.company && <span className="text-muted ms-2">({user.company})</span>}
          <span className="ms-2">Inquiries: {user.totalRequests}</span>
          {user.lastActivity && (
            <span className="text-muted ms-2">Last: {user.lastActivity}</span>
          )}
        </Col>
        <Col xs="auto">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => onToggle(user.userId)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '\u25B2' : '\u25BC'}
          </Button>
        </Col>
      </Row>

      {isExpanded && (
        <Row className="mt-2">
          {STATUSES.map((status) => (
            <Col key={status} md={3}>
              <h6 className="text-capitalize">{status.replace('_', ' ')}</h6>
              {isLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                requests
                  ?.filter((r) => r.status === status)
                  .map((req) => (
                    <Card
                      key={req.id}
                      className="mb-2 cursor-pointer"
                      role="button"
                      onClick={() => onSelectUser(user.userId)}
                    >
                      <Card.Body className="p-2">
                        <Card.Text className="small mb-1">
                          {truncate(getPreviewText(req))}
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">{req.created_at}</small>
                          <InquiryStatusBadge status={req.status} />
                        </div>
                      </Card.Body>
                    </Card>
                  ))
              )}
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
