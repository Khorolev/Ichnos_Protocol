import Form from 'react-bootstrap/Form';

export default function AuthSignupForm({ fields, onChange }) {
  const update = (key) => (e) =>
    onChange({ ...fields, [key]: e.target.value });

  return (
    <>
      <Form.Group className="mb-3" controlId="signup-name">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          value={fields.name}
          onChange={update('name')}
          required
          placeholder="First name"
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="signup-surname">
        <Form.Label>Surname</Form.Label>
        <Form.Control
          type="text"
          value={fields.surname}
          onChange={update('surname')}
          required
          placeholder="Last name"
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="signup-email">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          value={fields.email}
          onChange={update('email')}
          required
          placeholder="you@example.com"
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="signup-password">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          value={fields.password}
          onChange={update('password')}
          required
          placeholder="At least 6 characters"
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="signup-company">
        <Form.Label>Company (optional)</Form.Label>
        <Form.Control
          type="text"
          value={fields.company}
          onChange={update('company')}
          placeholder="Company name"
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="signup-phone">
        <Form.Label>Phone (optional)</Form.Label>
        <Form.Control
          type="tel"
          value={fields.phone}
          onChange={update('phone')}
          placeholder="+1 234 567 890"
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="signup-linkedin">
        <Form.Label>LinkedIn (optional)</Form.Label>
        <Form.Control
          type="url"
          value={fields.linkedin}
          onChange={update('linkedin')}
          placeholder="https://linkedin.com/in/..."
        />
      </Form.Group>
    </>
  );
}
