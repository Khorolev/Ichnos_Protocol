import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { COMPANY_INFO, CONTACT_INFO } from '../../constants/companyInfo';
import SocialLinks from '../molecules/SocialLinks';

const socialLinks = [
  {
    url: CONTACT_INFO.linkedInCompany,
    icon: 'linkedin',
    label: 'LinkedIn Company',
  },
  {
    url: CONTACT_INFO.linkedInFounder,
    icon: 'person-circle',
    label: 'LinkedIn Founder',
  },
  {
    url: CONTACT_INFO.calendly,
    icon: 'calendar-event',
    label: 'Book a Meeting',
  },
];

export default function Footer() {
  return (
    <footer className="footer-main mt-auto py-4 px-3">
      <Container>
        <Row className="gy-3">
          <Col xs={12} md={4}>
            <h6 className="fw-semibold mb-1 footer-heading">
              {COMPANY_INFO.legalName}
            </h6>
            <p className="small mb-1 footer-text">
              UEN: {COMPANY_INFO.uen}
            </p>
            <p className="small mb-0 footer-text">
              {COMPANY_INFO.registeredAddress}
            </p>
          </Col>

          <Col xs={12} md={4}>
            <h6 className="fw-semibold mb-2 footer-heading">
              Contact
            </h6>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="small text-decoration-none d-block mb-2 footer-link"
            >
              {CONTACT_INFO.email}
            </a>
            <SocialLinks links={socialLinks} />
          </Col>

          <Col xs={12} md={4} className="text-md-end">
            <p className="small mb-0 footer-text">
              &copy; {new Date().getFullYear()} {COMPANY_INFO.legalName}
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}
