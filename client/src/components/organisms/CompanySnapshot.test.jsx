import { axe } from 'vitest-axe';
import { renderWithProviders, screen, cleanup } from '../../test-utils';
import CompanySnapshot from './CompanySnapshot';

const LOCKED_PARAGRAPH =
  'Ichnos Protocol helps OEMs, Tier-1 suppliers, and recyclers build battery systems and battery passports that work in production — not just on paper. We bring practitioner-led depth across systems engineering, safety, mechanical development, remanufacturing, and EU/APAC compliance — so your program clears the regulation and survives the factory floor.';

const DIFFERENTIATOR_LABELS = [
  'PhD-level circular-economy depth',
  'EU regulation, APAC supply chains',
  'Practitioner-led',
];

describe('CompanySnapshot', () => {
  it('renders the "Why Ichnos" heading', () => {
    renderWithProviders(<CompanySnapshot />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Why Ichnos' }),
    ).toBeInTheDocument();
  });

  it('renders the positioning paragraph verbatim', () => {
    renderWithProviders(<CompanySnapshot />);
    const paragraph = screen.getByTestId('company-snapshot-paragraph');
    expect(paragraph.textContent).toBe(LOCKED_PARAGRAPH);
  });

  it('renders all three differentiator cards', () => {
    renderWithProviders(<CompanySnapshot />);
    DIFFERENTIATOR_LABELS.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders the "Meet the team →" link to /team', () => {
    renderWithProviders(<CompanySnapshot />);
    const link = screen.getByRole('link', { name: /meet the team/i });
    expect(link).toHaveAttribute('href', '/team');
  });

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<CompanySnapshot />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
