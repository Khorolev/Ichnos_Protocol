import Modal from 'react-bootstrap/Modal';
import { InlineWidget } from 'react-calendly';

const CALENDLY_URL = import.meta.env.VITE_CALENDLY_URL;

export default function CalendlyModal({ isOpen, onClose }) {
  return (
    <Modal show={isOpen} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Schedule a Call</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {CALENDLY_URL ? (
          <InlineWidget url={CALENDLY_URL} />
        ) : (
          <p>
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Schedule a call via Calendly
            </a>
          </p>
        )}
      </Modal.Body>
    </Modal>
  );
}
