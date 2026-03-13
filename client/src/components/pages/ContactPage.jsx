import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';

import { openModal as openChatModal } from '../../features/chat/chatSlice';
import { openModal as openContactModal } from '../../features/contact/contactSlice';
import { useGetMyRequestsQuery } from '../../features/contact/contactApi';
import PageTransition from '../templates/PageTransition';
import Button from '../atoms/Button';
import MyInquiriesList from '../molecules/MyInquiriesList';
import ContactForm from '../organisms/ContactForm';
import CalendlyModal from '../organisms/CalendlyModal';

export default function ContactPage() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const [calendlyOpen, setCalendlyOpen] = useState(false);

  const { data: requestsData, isLoading } = useGetMyRequestsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const requests = requestsData?.data || [];

  const handleAddQuestion = (requestId) => dispatch(openContactModal({ requestId }));

  return (
    <div>
      <Helmet>
        <title>Contact | Ichnos Protocol</title>
        <meta name="description" content="Get in touch with Ichnos Protocol. Ask our AI assistant, submit an inquiry, or schedule a call." />
      </Helmet>

      <PageTransition>
        <header className="text-center py-5">
          <h1 className="mb-3 page-title">Get in Touch</h1>
          <p className="lead section-subtext">
            Ask our AI assistant, submit an inquiry, or schedule a call.
          </p>
        </header>

        <Container>
          {isLoading && <Spinner animation="border" className="d-block mx-auto mb-4" />}

          {isAuthenticated && requests.length > 0 && (
            <MyInquiriesList
              requests={requests}
              onAddQuestion={handleAddQuestion}
              onNewInquiry={() => dispatch(openContactModal())}
            />
          )}

          <section className="text-center mb-5">
            <h2 className="h4 mb-3">Chat with our AI Assistant</h2>
            <p>
              Get instant answers about batteries, EU homologation, and battery
              passport. Powered by Grok AI.
            </p>
            <Button onClick={() => dispatch(openChatModal())}>Start Chat</Button>
          </section>

          <section className="text-center mb-5">
            <h2 className="h4 mb-3">Submit an Inquiry</h2>
            <p>Have a specific question? Send us your inquiry and we'll respond within 24 hours.</p>
            <Button variant="outline-primary" onClick={() => dispatch(openContactModal())}>
              Submit Inquiry
            </Button>
          </section>

          <section className="text-center mb-5">
            <h2 className="h4 mb-3">Schedule a Call</h2>
            <p>Prefer to talk directly? Book a meeting at your convenience.</p>
            <Button variant="outline-secondary" onClick={() => setCalendlyOpen(true)}>
              Book a Meeting
            </Button>
          </section>
        </Container>
      </PageTransition>

      <ContactForm />
      <CalendlyModal isOpen={calendlyOpen} onClose={() => setCalendlyOpen(false)} />
    </div>
  );
}
