import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';

import Button from '../atoms/Button';

export default function ProfileCompletionForm({
  completionFields,
  onFieldChange,
  canonicalEmail,
  loading,
  onSubmit,
  onLogout,
}) {
  const update = (key) => (e) =>
    onFieldChange({ ...completionFields, [key]: e.target.value });

  return (
    <Form onSubmit={onSubmit}>
      <Form.Group className="mb-3" controlId="completion-name">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          value={completionFields.name}
          onChange={update('name')}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="completion-surname">
        <Form.Label>Surname</Form.Label>
        <Form.Control
          type="text"
          value={completionFields.surname}
          onChange={update('surname')}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="completion-email">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          value={canonicalEmail}
          disabled
          readOnly
        />
      </Form.Group>

      <div className="d-flex gap-2 mt-3">
        <Button
          type="submit"
          variant="primary"
          className="flex-grow-1"
          disabled={loading}
        >
          {loading && (
            <Spinner
              size="sm"
              animation="border"
              className="me-2"
              data-testid="auth-submit-spinner"
            />
          )}
          Continue
        </Button>
        <Button
          type="button"
          variant="outline-secondary"
          onClick={onLogout}
        >
          Logout
        </Button>
      </div>
    </Form>
  );
}
