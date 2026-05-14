import { axe } from 'vitest-axe';
import { renderWithProviders, screen, cleanup } from '../../test-utils';
import PassportContactCta from './PassportContactCta';

describe('PassportContactCta', () => {
  it('renders with the passport-contact section id', () => {
    renderWithProviders(<PassportContactCta />);
    const section = screen.getByTestId('passport-contact-cta');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('id', 'passport-contact');
  });

  it('renders the heading with the locked copy', () => {
    renderWithProviders(<PassportContactCta />);
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Get in touch',
      }),
    ).toBeInTheDocument();
  });

  it('renders the body paragraph with the locked copy', () => {
    renderWithProviders(<PassportContactCta />);
    expect(
      screen.getByText(
        "Considering Battery Passport implementation for your battery program? We'd like to hear about it.",
      ),
    ).toBeInTheDocument();
  });

  it('renders the CTA as an anchor to /contact with the locked label', () => {
    renderWithProviders(<PassportContactCta />);
    const cta = screen.getByRole('button', {
      name: 'Contact Us →',
    });
    expect(cta.tagName).toBe('A');
    expect(cta).toHaveAttribute('href', '/contact');
  });

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<PassportContactCta />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
