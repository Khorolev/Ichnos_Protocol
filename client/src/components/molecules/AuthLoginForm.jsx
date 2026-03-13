import Form from 'react-bootstrap/Form';

export default function AuthLoginForm({ fields, onChange }) {
  const update = (key) => (e) =>
    onChange({ ...fields, [key]: e.target.value });

  return (
    <>
      <Form.Group className="mb-3" controlId="login-email">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          value={fields.email}
          onChange={update('email')}
          required
          placeholder="you@example.com"
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="login-password">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          value={fields.password}
          onChange={update('password')}
          required
          placeholder="Enter password"
        />
      </Form.Group>
    </>
  );
}
