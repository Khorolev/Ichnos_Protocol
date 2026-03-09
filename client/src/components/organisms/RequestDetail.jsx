import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';

const STATUS_OPTIONS = ['new', 'contacted', 'in_progress', 'resolved'];

function getQuestionText(q) {
  if (typeof q === 'string') return q;
  return q.question || q.text || '';
}

export default function RequestDetail({ request, onBack, onSave, onDelete }) {
  const [status, setStatus] = useState(request.status);
  const [adminNotes, setAdminNotes] = useState(request.adminNotes ?? request.admin_notes ?? '');

  function handleSave() {
    onSave({ status, adminNotes });
  }

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this request?')) {
      onDelete();
    }
  }

  return (
    <div>
      <Button variant="link" className="mb-3 p-0" onClick={onBack}>
        Back
      </Button>

      {request.questions?.length > 0
        ? request.questions.map((q, i) => (
            <Card key={i} className="mb-2">
              <Card.Body>
                <Card.Text>{getQuestionText(q)}</Card.Text>
              </Card.Body>
            </Card>
          ))
        : request.questionPreview && (
            <Card className="mb-2">
              <Card.Body>
                <Card.Text>{request.questionPreview}</Card.Text>
              </Card.Body>
            </Card>
          )}

      <Form.Group className="mb-3" controlId="requestStatus">
        <Form.Label>Status</Form.Label>
        <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="adminNotes">
        <Form.Label>Admin Notes</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
        />
      </Form.Group>

      <div className="d-flex gap-2">
        <Button variant="primary" onClick={handleSave}>Save</Button>
        <Button variant="danger" onClick={handleDelete}>Delete</Button>
      </div>
    </div>
  );
}
