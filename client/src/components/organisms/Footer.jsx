import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Link } from 'react-router-dom';

import { COMPANY_INFO, CONTACT_INFO } from '../../constants/companyInfo';
import SocialLinks from '../molecules/SocialLinks';
import Logo from '../atoms/Logo';

const BRAND_DESCRIPTION =
  'End-to-end battery compliance consulting and Battery Passport solutions for the EU regulatory landscape.';

const COMPANY_LINKS = [
  { label: 'Services', to: '/services' },
  { label: 'Team', to: '/team' },
];

const SOLUTIONS_LINKS = [
  { label: 'Battery Advisory', to: '/services' },
  { label: 'Battery Passport', to: '/passport' },
];

const SOCIAL_LINKS = [
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

const ATTRIBUTION_TEXT =
  '© 2026 Ichnos Protocol Pte. Ltd. — All rights reserved. · Photo: Unsplash';

export default function Footer() {
  return (
    <footer className="footer-main mt-auto">
      <Container className="footer-container">
        <Row className="gy-4">
          <Col xs={12} lg={4} data-testid="footer-col-brand">
            <Logo className="footer-logo" />
            <p className="footer-text footer-brand-desc">{BRAND_DESCRIPTION}</p>
            <p className="footer-text small mb-0">UEN: {COMPANY_INFO.uen}</p>
          </Col>

          <Col xs={12} lg={2} data-testid="footer-col-company">
            <h6 className="footer-heading">Company</h6>
            {COMPANY_LINKS.map(({ label, to }) => (
              <Link key={label} to={to} className="footer-link d-block">
                {label}
              </Link>
            ))}
          </Col>

          <Col xs={12} lg={2} data-testid="footer-col-solutions">
            <h6 className="footer-heading">Solutions</h6>
            {SOLUTIONS_LINKS.map(({ label, to }) => (
              <Link key={label} to={to} className="footer-link d-block">
                {label}
              </Link>
            ))}
          </Col>

          <Col xs={12} lg={4} data-testid="footer-col-contact">
            <h6 className="footer-heading">Contact</h6>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="footer-link d-block"
            >
              {CONTACT_INFO.email}
            </a>
            <a
              href={CONTACT_INFO.linkedInCompany}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link d-block"
            >
              LinkedIn Company
            </a>
            <address className="footer-text footer-address">
              {COMPANY_INFO.registeredAddress}
            </address>
            <div className="footer-socials" data-testid="footer-socials">
              <SocialLinks links={SOCIAL_LINKS} />
            </div>
          </Col>
        </Row>

        <div
          className="footer-attribution text-center"
          data-testid="footer-attribution"
        >
          {ATTRIBUTION_TEXT}
        </div>
      </Container>
    </footer>
  );
}
