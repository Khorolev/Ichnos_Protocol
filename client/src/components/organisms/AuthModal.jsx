import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';

import ProfileCompletionForm from '../molecules/ProfileCompletionForm';
import AuthLoginSignupBody from '../molecules/AuthLoginSignupBody';
import { useAuthModal } from '../../hooks/useAuthModal';

export default function AuthModal() {
  const {
    activeTab,
    loginFields,
    signupFields,
    completionFields,
    error,
    loading,
    isCompletion,
    isLogin,
    show,
    canonicalEmail,
    setLoginFields,
    setSignupFields,
    setCompletionFields,
    handleClose,
    handleTabSwitch,
    handleLogin,
    handleSignup,
    handleCompletion,
    handleLogout,
  } = useAuthModal();

  if (isCompletion) {
    return (
      <Modal
        show={show}
        centered
        backdrop="static"
        keyboard={false}
        data-testid="auth-modal"
      >
        <Modal.Header className="auth-modal-header">
          <Modal.Title className="auth-modal-title">
            Complete Your Profile
          </Modal.Title>
          <button
            type="button"
            className="btn-close pe-none opacity-25"
            disabled
            aria-label="Close"
          />
        </Modal.Header>
        <Modal.Body className="auth-modal-body">
          <Alert variant="warning">
            Please complete your profile before continuing.
          </Alert>
          {error && <Alert variant="danger">{error}</Alert>}
          <ProfileCompletionForm
            completionFields={completionFields}
            onFieldChange={setCompletionFields}
            canonicalEmail={canonicalEmail}
            loading={loading}
            onSubmit={handleCompletion}
            onLogout={handleLogout}
          />
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      data-testid="auth-modal"
    >
      <Modal.Header closeButton className="auth-modal-header">
        <Modal.Title className="auth-modal-title">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="auth-modal-body">
        <AuthLoginSignupBody
          activeTab={activeTab}
          isLogin={isLogin}
          error={error}
          loading={loading}
          loginFields={loginFields}
          signupFields={signupFields}
          onTabSwitch={handleTabSwitch}
          onLoginFieldChange={setLoginFields}
          onSignupFieldChange={setSignupFields}
          onSubmit={isLogin ? handleLogin : handleSignup}
        />
      </Modal.Body>
    </Modal>
  );
}
