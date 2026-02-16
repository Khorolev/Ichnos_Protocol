import { useState } from 'react';
import { useDispatch } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import Nav from 'react-bootstrap/Nav';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

import { auth } from '../../config/firebase';
import { useSyncProfileMutation } from '../../features/auth/authApi';
import { setUser, setAdmin } from '../../features/auth/authSlice';
import { formatFirebaseError } from '../../helpers/firebaseErrors';
import Button from '../atoms/Button';
import AuthLoginForm from '../molecules/AuthLoginForm';
import AuthSignupForm from '../molecules/AuthSignupForm';

const INITIAL_SIGNUP = {
  email: '',
  password: '',
  name: '',
  surname: '',
  company: '',
  phone: '',
  linkedin: '',
};

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [syncProfile] = useSyncProfileMutation();
  const [activeTab, setActiveTab] = useState('login');
  const [loginFields, setLoginFields] = useState({ email: '', password: '' });
  const [signupFields, setSignupFields] = useState(INITIAL_SIGNUP);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setLoginFields({ email: '', password: '' });
    setSignupFields(INITIAL_SIGNUP);
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleTabSwitch = (tab) => {
    setError('');
    setActiveTab(tab);
  };

  const syncAndDispatch = async (firebaseUser, profileData) => {
    const result = await syncProfile(profileData).unwrap();
    dispatch(setUser(result.data?.user || profileData));
    dispatch(setAdmin(result.data?.isAdmin || false));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        loginFields.email,
        loginFields.password,
      );
      await syncAndDispatch(user, {
        firebaseUid: user.uid,
        email: user.email,
      });
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        signupFields.email,
        signupFields.password,
      );
      await syncAndDispatch(user, {
        firebaseUid: user.uid,
        email: signupFields.email,
        name: signupFields.name,
        surname: signupFields.surname,
        company: signupFields.company || undefined,
        phone: signupFields.phone || undefined,
        linkedin: signupFields.linkedin || undefined,
      });
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const isLogin = activeTab === 'login';

  return (
    <Modal show={isOpen} onHide={handleClose} centered>
      <Modal.Header closeButton className="auth-modal-header">
        <Modal.Title className="auth-modal-title">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="auth-modal-body">
        <Nav
          variant="tabs"
          activeKey={activeTab}
          onSelect={handleTabSwitch}
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

        <Form onSubmit={isLogin ? handleLogin : handleSignup}>
          {isLogin ? (
            <AuthLoginForm fields={loginFields} onChange={setLoginFields} />
          ) : (
            <AuthSignupForm
              fields={signupFields}
              onChange={setSignupFields}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-100 mt-3"
            disabled={loading}
          >
            {loading && (
              <Spinner size="sm" animation="border" className="me-2" />
            )}
            {isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </Form>

        {!isLogin && (
          <p className="small mt-3 mb-0 auth-privacy-notice">
            By signing up you agree to our data processing practices.
          </p>
        )}
      </Modal.Body>
    </Modal>
  );
}
