import { COMPANY_INFO, CONTACT_INFO } from '../../constants/companyInfo';
import { CONTACT_SECTION_CONTENT } from '../../constants/services';
import Icon from '../atoms/Icon';

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

const ContactSection = () => (
  <section className="py-5">
    <h2 className="text-center mb-2 section-heading">
      {CONTACT_SECTION_CONTENT.heading}
    </h2>
    <p className="text-center mb-5 section-subtext">
      {CONTACT_SECTION_CONTENT.subtext}
    </p>
    <div className="row justify-content-center">
      <div className="col-12 col-md-6 mb-4">
        <div className="card h-100 contact-card">
          <div className="card-body">
            <h3 className="h5 mb-4 contact-card-title">
              {CONTACT_SECTION_CONTENT.contactCardTitle}
            </h3>
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
              label={CONTACT_SECTION_CONTENT.links.bookMeeting}
              external
            />
          </div>
        </div>
      </div>
      <div className="col-12 col-md-6 mb-4">
        <div className="card h-100 contact-card">
          <div className="card-body">
            <h3 className="h5 mb-4 contact-card-title">
              {CONTACT_SECTION_CONTENT.companyCardTitle}
            </h3>
            <p className="mb-2 contact-card-text">
              <strong>{CONTACT_SECTION_CONTENT.labels.legalName}</strong>{' '}
              {COMPANY_INFO.legalName}
            </p>
            <p className="mb-2 contact-card-text">
              <strong>{CONTACT_SECTION_CONTENT.labels.uen}</strong>{' '}
              {COMPANY_INFO.uen}
            </p>
            <p className="mb-0 contact-card-text">
              <strong>{CONTACT_SECTION_CONTENT.labels.address}</strong>{' '}
              {COMPANY_INFO.registeredAddress}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ContactSection;
