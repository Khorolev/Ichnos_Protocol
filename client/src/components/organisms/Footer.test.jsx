import { axe } from 'vitest-axe';
import { renderWithProviders, screen, cleanup } from '../../test-utils';
import Footer from './Footer';
import { COMPANY_INFO, CONTACT_INFO } from '../../constants/companyInfo';

describe('Footer', () => {
  beforeEach(() => {
    renderWithProviders(<Footer />);
  });

  it('displays COMPANY_INFO.legalName', () => {
    expect(screen.getByText(COMPANY_INFO.legalName)).toBeInTheDocument();
  });

  it('displays UEN number', () => {
    expect(screen.getByText(`UEN: ${COMPANY_INFO.uen}`)).toBeInTheDocument();
  });

  it('displays registered address', () => {
    expect(screen.getByText(COMPANY_INFO.registeredAddress)).toBeInTheDocument();
  });

  it('displays email link with mailto: href', () => {
    const emailLink = screen.getByRole('link', { name: CONTACT_INFO.email });
    expect(emailLink).toHaveAttribute('href', `mailto:${CONTACT_INFO.email}`);
  });

  it('renders SocialLinks with LinkedIn and Calendly links', () => {
    expect(screen.getByLabelText('LinkedIn Company')).toBeInTheDocument();
    expect(screen.getByLabelText('LinkedIn Founder')).toBeInTheDocument();
    expect(screen.getByLabelText('Book a Meeting')).toBeInTheDocument();
  });

  it('all social links have target="_blank"', () => {
    const linkedInLink = screen.getByLabelText('LinkedIn Company');
    const founderLink = screen.getByLabelText('LinkedIn Founder');
    const calendlyLink = screen.getByLabelText('Book a Meeting');

    expect(linkedInLink).toHaveAttribute('target', '_blank');
    expect(founderLink).toHaveAttribute('target', '_blank');
    expect(calendlyLink).toHaveAttribute('target', '_blank');
  });

  it('displays copyright with current year', () => {
    const year = new Date().getFullYear();
    const copyright = screen.getByText(new RegExp(`\\u00A9\\s*${year}`));
    expect(copyright).toBeInTheDocument();
  });

  it('has semantic <footer> element', () => {
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('all links are keyboard accessible', () => {
    const emailLink = screen.getByRole('link', { name: CONTACT_INFO.email });
    emailLink.focus();
    expect(emailLink).toHaveFocus();
  });

  it('social links have aria-labels', () => {
    expect(screen.getByLabelText('LinkedIn Company')).toHaveAttribute('href', CONTACT_INFO.linkedInCompany);
    expect(screen.getByLabelText('LinkedIn Founder')).toHaveAttribute('href', CONTACT_INFO.linkedInFounder);
    expect(screen.getByLabelText('Book a Meeting')).toHaveAttribute('href', CONTACT_INFO.calendly);
  });

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<Footer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
