import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';

import { useGetMeQuery } from '../../features/auth/authApi';
import { useSubmitContactMutation, useAddQuestionMutation } from '../../features/contact/contactApi';
import { closeModal, setFormData } from '../../features/contact/contactSlice';
import Button from '../atoms/Button';
import ContactFormProfile from '../molecules/ContactFormProfile';
import AuthModal from './AuthModal';
import CalendlyModal from './CalendlyModal';

export default function ContactForm() {
  const dispatch = useDispatch();
  const isOpen = useSelector((s) => s.contact.isOpen);
  const requestId = useSelector((s) => s.contact.requestId);
  const savedFormData = useSelector((s) => s.contact.formData);
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const [submitContact, { isLoading: isSubmitting }] = useSubmitContactMutation();
  const [addQuestion, { isLoading: isAdding }] = useAddQuestionMutation();
  const isLoading = isSubmitting || isAdding;

  const [questions, setQuestions] = useState(['']);
  const [consent, setConsent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [calendlyOpen, setCalendlyOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  useEffect(() => {
    if (isOpen && !isAuthenticated) setAuthModalOpen(true);
  }, [isOpen, isAuthenticated]);

  const profile = meData?.data?.profile;

  const handleQuestionChange = (index, value) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? value : q)));
  };

  const doSubmit = async (qs) => {
    setError('');
    const filtered = qs.filter((t) => t.trim()).map((text) => ({ text }));
    if (!filtered.length) return;
    try {
      if (requestId) {
        await addQuestion({ id: requestId, question: filtered[0].text }).unwrap();
      } else {
        await submitContact({
          questions: filtered,
          consentTimestamp: new Date().toISOString(),
          consentVersion: 'v1',
        }).unwrap();
      }
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!consent) return;
    if (!isAuthenticated) {
      dispatch(setFormData({ questions, consent }));
      setPendingSubmit(true);
      setAuthModalOpen(true);
      return;
    }
    doSubmit(questions);
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    if (pendingSubmit) {
      const restored = savedFormData.questions || questions;
      setPendingSubmit(false);
      doSubmit(restored);
    }
  };

  const handleClose = () => {
    dispatch(closeModal());
    setQuestions(['']);
    setConsent(false);
    setSuccess(false);
    setError('');
    setPendingSubmit(false);
  };

  return (
    <>
      <Modal show={isOpen} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{requestId ? 'Add a Follow-up Question' : 'Submit an Inquiry'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {success ? (
            <SuccessView onBook={() => setCalendlyOpen(true)} />
          ) : (
            <Form onSubmit={handleSubmit}>
              <ContactFormProfile profile={profile} />
              {error && <Alert variant="danger">{error}</Alert>}
              {questions.map((q, i) => (
                <Form.Group key={i} className="mb-3" controlId={`question-${i + 1}`}>
                  <Form.Label>Question {i + 1}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={q}
                    onChange={(e) => handleQuestionChange(i, e.target.value)}
                    required
                  />
                </Form.Group>
              ))}
              {!requestId && questions.length < 3 && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="mb-3"
                  onClick={() => setQuestions((p) => [...p, ''])}
                >
                  Add another question
                </Button>
              )}
              <Form.Check
                type="checkbox"
                label="I agree to be contacted regarding my enquiry. See Privacy Policy."
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mb-3"
                required
              />
              <Button type="submit" disabled={isLoading || !consent}>
                {isLoading && <Spinner size="sm" animation="border" className="me-2" />}
                {requestId ? 'Add Question' : 'Submit Inquiry'}
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onSuccess={handleAuthSuccess} />
      <CalendlyModal isOpen={calendlyOpen} onClose={() => setCalendlyOpen(false)} />
    </>
  );
}

function SuccessView({ onBook }) {
  return (
    <>
      <Alert variant="success">Inquiry submitted! We'll respond within 24 hours.</Alert>
      <Button onClick={onBook}>Book a Meeting</Button>
    </>
  );
}
