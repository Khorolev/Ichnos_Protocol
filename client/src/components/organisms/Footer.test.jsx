import { axe } from 'vitest-axe';
import { within } from '@testing-library/react';
import { renderWithProviders, screen, cleanup } from '../../test-utils';
import Footer from './Footer';
import { COMPANY_INFO, CONTACT_INFO } from '../../constants/companyInfo';

const ATTRIBUTION_TEXT =
  '© 2026 Ichnos Protocol Pte. Ltd. — All rights reserved.';

describe('Footer', () => {
  beforeEach(() => {
    renderWithProviders(<Footer />);
  });

  it('displays COMPANY_INFO.legalName in attribution row', () => {
    const attribution = screen.getByTestId('footer-attribution');
    expect(attribution).toHaveTextContent(COMPANY_INFO.legalName);
  });

  it('displays UEN number in contact column', () => {
    const contactCol = screen.getByTestId('footer-col-contact');
    expect(
      within(contactCol).getByText(`UEN: ${COMPANY_INFO.uen}`),
    ).toBeInTheDocument();
    const brandCol = screen.getByTestId('footer-col-brand');
    expect(within(brandCol).queryByText(/UEN/i)).toBeNull();
  });

  it('brand column shows the exact tagline copy', () => {
    const brandCol = screen.getByTestId('footer-col-brand');
    expect(
      within(brandCol).getByText(
        'Battery consulting and battery passport solutions.',
      ),
    ).toBeInTheDocument();
  });

  it('displays registered address in contact column', () => {
    const contactCol = screen.getByTestId('footer-col-contact');
    expect(
      within(contactCol).getByText(COMPANY_INFO.registeredAddress),
    ).toBeInTheDocument();
  });

  it('displays email link with mailto: href', () => {
    const emailLink = screen.getByRole('link', { name: CONTACT_INFO.email });
    expect(emailLink).toHaveAttribute('href', `mailto:${CONTACT_INFO.email}`);
  });

  it('renders SocialLinks with LinkedIn and Calendly icons by aria-label', () => {
    expect(screen.getByLabelText('LinkedIn Company')).toBeInTheDocument();
    expect(screen.getByLabelText('LinkedIn Founder')).toBeInTheDocument();
    expect(screen.getByLabelText('Book a Meeting')).toBeInTheDocument();
  });

  it('all social icon links have target="_blank" and rel="noopener noreferrer"', () => {
    ['LinkedIn Company', 'LinkedIn Founder', 'Book a Meeting'].forEach(
      (label) => {
        const link = screen.getByLabelText(label);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      },
    );
  });

  it('social icon hrefs match CONTACT_INFO values', () => {
    expect(screen.getByLabelText('LinkedIn Company')).toHaveAttribute(
      'href',
      CONTACT_INFO.linkedInCompany,
    );
    expect(screen.getByLabelText('LinkedIn Founder')).toHaveAttribute(
      'href',
      CONTACT_INFO.linkedInFounder,
    );
    expect(screen.getByLabelText('Book a Meeting')).toHaveAttribute(
      'href',
      CONTACT_INFO.calendly,
    );
  });

  it('Company column contains Why Ichnos → / and Team → /team and excludes Services/About', () => {
    const companyCol = screen.getByTestId('footer-col-company');
    expect(
      within(companyCol).getByRole('link', { name: 'Why Ichnos' }),
    ).toHaveAttribute('href', '/');
    expect(
      within(companyCol).getByRole('link', { name: 'Team' }),
    ).toHaveAttribute('href', '/team');
    expect(
      within(companyCol).queryByRole('link', { name: 'Why Ichnos Protocol' }),
    ).toBeNull();
    expect(
      within(companyCol).queryByRole('link', { name: 'Services' }),
    ).toBeNull();
    expect(
      within(companyCol).queryByRole('link', { name: 'About' }),
    ).toBeNull();
  });

  it('Services column has Battery Advisory → /services', () => {
    const servicesCol = screen.getByTestId('footer-col-services');
    expect(
      within(servicesCol).getByRole('link', { name: 'Battery Advisory' }),
    ).toHaveAttribute('href', '/services');
  });

  it('Products column has Battery Passport → /passport', () => {
    const productsCol = screen.getByTestId('footer-col-products');
    expect(
      within(productsCol).getByRole('link', { name: 'Battery Passport' }),
    ).toHaveAttribute('href', '/passport');
  });

  it('contact column has Submit an Inquiry link to /contact', () => {
    const contactCol = screen.getByTestId('footer-col-contact');
    expect(
      within(contactCol).getByRole('link', { name: 'Submit an Inquiry' }),
    ).toHaveAttribute('href', '/contact');
  });

  it('contact column does not render a text link labeled "LinkedIn Company"', () => {
    const contactCol = screen.getByTestId('footer-col-contact');
    expect(within(contactCol).queryByText('LinkedIn Company')).toBeNull();
  });

  it('attribution row contains exact text, year 2026, and legal name', () => {
    const attribution = screen.getByTestId('footer-attribution');
    expect(attribution).toHaveTextContent(ATTRIBUTION_TEXT);
    expect(attribution).toHaveTextContent('2026');
    expect(attribution).toHaveTextContent(COMPANY_INFO.legalName);
  });

  it('attribution row does not include any photo credit text', () => {
    const attribution = screen.getByTestId('footer-attribution');
    expect(attribution).not.toHaveTextContent('Photo:');
    expect(attribution).not.toHaveTextContent('Photography:');
    expect(attribution).not.toHaveTextContent('Unsplash');
  });

  it('has semantic <footer> element', () => {
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('email link is keyboard focusable', () => {
    const emailLink = screen.getByRole('link', { name: CONTACT_INFO.email });
    emailLink.focus();
    expect(emailLink).toHaveFocus();
  });

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<Footer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
