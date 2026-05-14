import Nav from 'react-bootstrap/Nav';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';

import Button from '../atoms/Button';
import AuthLoginForm from './AuthLoginForm';
import AuthSignupForm from './AuthSignupForm';

export default function AuthLoginSignupBody({
  activeTab,
  isLogin,
  error,
  loading,
  loginFields,
  signupFields,
  onTabSwitch,
  onLoginFieldChange,
  onSignupFieldChange,
  onSubmit,
}) {
  return (
    <>
      <Nav
        variant="tabs"
        activeKey={activeTab}
        onSelect={onTabSwitch}
        className="mb-3"
      >
        <Nav.Item>
          <Nav.Link eventKey="login">Login</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="signup">Sign Up</Nav.Link>
        </Nav.Item>
      </Nav>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={onSubmit}>
        {isLogin ? (
          <AuthLoginForm fields={loginFields} onChange={onLoginFieldChange} />
        ) : (
          <AuthSignupForm
            fields={signupFields}
            onChange={onSignupFieldChange}
          />
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-100 mt-3"
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
          {isLogin ? 'Login' : 'Sign Up'}
        </Button>
      </Form>

      {!isLogin && (
        <p className="small mt-3 mb-0 auth-privacy-notice">
          By signing up you agree to our data processing practices.
        </p>
      )}
    </>
  );
}
