import { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';

import Button from '../atoms/Button';

const CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

export default function DeleteAccountModal({ show, onClose, onConfirm, isLoading }) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!show) setConfirmText('');
  }, [show]);

  const isConfirmed = confirmText === CONFIRMATION_PHRASE;

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Are you sure?</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Alert variant="warning">
          This action cannot be undone. Your contact details will be permanently
          removed. Identifiable patterns (emails, phone numbers, URLs) will be
          scrubbed from your questions. Anonymized question content may be
          retained for aggregated analytics.
        </Alert>

        <Form.Group>
          <Form.Label>
            Type <strong>{CONFIRMATION_PHRASE}</strong> to confirm
          </Form.Label>
          <Form.Control
            type="text"
            placeholder={CONFIRMATION_PHRASE}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="danger"
          disabled={!isConfirmed || isLoading}
          onClick={onConfirm}
        >
          {isLoading ? <Spinner animation="border" size="sm" /> : 'Delete Account'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
