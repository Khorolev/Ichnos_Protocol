import { Link } from 'react-router-dom';
import { Element } from 'react-scroll';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import {
  CONTACT_INFO,
  CONTACT_SECTION_CONTENT,
} from '../../constants/companyInfo';
import Icon from '../atoms/Icon';
import ChatPanel from '../molecules/ChatPanel';

const ContactLink = ({ href, icon, label, external = false }) => (
  <a
    href={href}
    className="d-flex align-items-center mb-3 text-decoration-none contact-link"
    {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
  >
    <Icon name={icon} className="me-2 fs-5" />
    <span>{label}</span>
  </a>
);

export default function ContactSection({
  showFullContactLink = false,
  persistChat = false,
}) {
  return (
    <Element name="contact">
      <section id="contact" className="py-5">
        <h2 className="text-center mb-2 section-heading section-display-heading">
          {CONTACT_SECTION_CONTENT.heading}
        </h2>
        <p className="text-center mb-5 text-secondary">
          {CONTACT_SECTION_CONTENT.subhead}
        </p>
        <Row className="justify-content-center">
          <Col xs={12} lg={8} className="mb-4">
            <ChatPanel mode="inline" persistState={persistChat} />
          </Col>
          <Col xs={12} lg={4} className="mb-4">
            <ContactLink
              href={`mailto:${CONTACT_INFO.email}`}
              icon="envelope"
              label={CONTACT_INFO.email}
            />
            <ContactLink
              href={CONTACT_INFO.linkedInCompany}
              icon="linkedin"
              label={CONTACT_SECTION_CONTENT.links.linkedInCompany}
              external
            />
            <ContactLink
              href={CONTACT_INFO.linkedInFounder}
              icon="person-circle"
              label={CONTACT_SECTION_CONTENT.links.linkedInFounder}
              external
            />
            <ContactLink
              href={CONTACT_INFO.calendly}
              icon="calendar-event"
              label={CONTACT_SECTION_CONTENT.links.bookCall}
              external
            />
            <p className="small text-muted mb-0">
              {CONTACT_SECTION_CONTENT.addressLine}
            </p>
          </Col>
        </Row>
        {showFullContactLink && (
          <div className="text-center mt-4">
            <Link
              to="/contact"
              className="fw-semibold"
              data-testid="contact-section-full-link"
            >
              Open the full contact page →
            </Link>
          </div>
        )}
      </section>
    </Element>
  );
}
