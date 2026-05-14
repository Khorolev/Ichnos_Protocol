import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';

import { openModal as openContactModal } from '../../features/contact/contactSlice';
import { useGetMyRequestsQuery } from '../../features/contact/contactApi';
import { CONTACT_META } from '../../constants/seoMeta';
import { PAGE_STRUCTURED_DATA } from '../../constants/structuredData';
import PageTransition from '../templates/PageTransition';
import MyInquiriesList from '../molecules/MyInquiriesList';
import SeoHead from '../molecules/SeoHead';
import ContactSection from '../organisms/ContactSection';
import ContactForm from '../organisms/ContactForm';
import CalendlyModal from '../organisms/CalendlyModal';

const CONTACT_PAGE_TITLE = 'Contact Ichnos Protocol';
const CONTACT_PAGE_INTRO =
  'About contacting us — this page brings every Ichnos Protocol touchpoint into one place. Ask the AI assistant for instant answers on battery systems, EU 2023/1542 homologation, MS 2818 alignment, or the Battery Passport, then follow up by email, LinkedIn, or a Calendly call. Authenticated visitors keep their full conversation history and pending questions.';

export default function ContactPage() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const [calendlyOpen, setCalendlyOpen] = useState(false);

  const { data: requestsData, isLoading } = useGetMyRequestsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const requests = requestsData?.data || [];

  const handleAddQuestion = (requestId) =>
    dispatch(openContactModal({ requestId }));

  return (
    <div>
      <SeoHead meta={CONTACT_META} schemas={PAGE_STRUCTURED_DATA.contact} />

      <PageTransition>
        <Container>
          {isLoading && (
            <Spinner animation="border" className="d-block mx-auto mb-4" />
          )}

          {isAuthenticated && requests.length > 0 && (
            <MyInquiriesList
              requests={requests}
              onAddQuestion={handleAddQuestion}
              onNewInquiry={() => dispatch(openContactModal())}
            />
          )}

          <header className="text-center mt-4">
            <h1 className="page-title">{CONTACT_PAGE_TITLE}</h1>
            <p className="lead mt-4">{CONTACT_PAGE_INTRO}</p>
          </header>

          <ContactSection persistChat={true} />

          <div className="d-flex flex-wrap gap-2 justify-content-center mt-4">
            <Button
              variant="outline-primary"
              onClick={() => dispatch(openContactModal())}
            >
              Submit a detailed inquiry
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => setCalendlyOpen(true)}
            >
              Schedule a call
            </Button>
          </div>
        </Container>
      </PageTransition>

      <ContactForm />
      <CalendlyModal isOpen={calendlyOpen} onClose={() => setCalendlyOpen(false)} />
    </div>
  );
}
