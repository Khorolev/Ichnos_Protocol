import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Link } from 'react-router-dom';

import { COMPANY_INFO, CONTACT_INFO } from '../../constants/companyInfo';
import { BRAND_TAGLINE_LOWER, PILLAR_LIST } from '../../constants/brandVocabulary';
import SocialLinks from '../molecules/SocialLinks';
import Logo from '../atoms/Logo';

const BRAND_DESCRIPTION = BRAND_TAGLINE_LOWER;

const SERVICES_LINKS = PILLAR_LIST.map(({ label, anchor }) => ({
  label,
  to: '/services',
  state: { scrollTo: anchor },
}));

const MENUS = [
  {
    heading: 'Company',
    testId: 'footer-col-company',
    links: [
      { label: 'Why Ichnos', to: '/', state: { scrollTo: 'company' } },
      { label: 'Team', to: '/team' },
    ],
  },
  {
    heading: 'Services',
    testId: 'footer-col-services',
    links: SERVICES_LINKS,
  },
  {
    heading: 'Products',
    testId: 'footer-col-products',
    links: [{ label: 'Battery Passport', to: '/passport' }],
  },
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
  '© 2026 Ichnos Protocol Pte. Ltd. — All rights reserved.';

export default function Footer() {
  return (
    <footer className="footer-dark mt-auto">
      <Container className="footer-container">
        <Row className="gy-4">
          <Col xs={12} lg={4} data-testid="footer-col-brand">
            <Logo theme="dark" className="footer-logo" />
            <p className="footer-text footer-brand-desc">{BRAND_DESCRIPTION}</p>
          </Col>

          {MENUS.map(({ heading, testId, links }) => (
            <Col xs={12} sm={6} lg={2} key={heading} data-testid={testId}>
              <h6 className="footer-heading">{heading}</h6>
              {links.map(({ label, to, state }) => (
                <Link
                  key={label}
                  to={to}
                  state={state}
                  className="footer-link d-block"
                >
                  {label}
                </Link>
              ))}
            </Col>
          ))}

          <Col xs={12} sm={6} lg={2} data-testid="footer-col-contact">
            <h6 className="footer-heading">Contact</h6>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="footer-link d-block"
            >
              {CONTACT_INFO.email}
            </a>
            <p className="footer-text small mb-0">UEN: {COMPANY_INFO.uen}</p>
            <Link to="/contact" className="footer-link d-block">
              Submit an Inquiry
            </Link>
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
