import { axe } from 'vitest-axe';
import { renderWithProviders, screen, cleanup } from '../../test-utils';
import PassportHero from './PassportHero';
import { PASSPORT_PAGE_CONTENT } from '../../constants/passportContent';

describe('PassportHero', () => {
  it('renders the title, subtitle, product mark, and status badge', () => {
    renderWithProviders(<PassportHero />);
    expect(screen.getByText(PASSPORT_PAGE_CONTENT.title)).toBeInTheDocument();
    expect(screen.getByText(PASSPORT_PAGE_CONTENT.subtitle)).toBeInTheDocument();
    expect(screen.getByTestId('passport-product-mark')).toHaveTextContent(
      PASSPORT_PAGE_CONTENT.productMark,
    );
    expect(screen.getByTestId('passport-status')).toHaveTextContent(
      PASSPORT_PAGE_CONTENT.statusBadge,
    );
  });

  it('renders the exact dual-standard paragraph from passport content', () => {
    renderWithProviders(<PassportHero />);
    const dualStandard = screen.getByTestId('passport-dual-standard');
    expect(dualStandard).toHaveTextContent(
      PASSPORT_PAGE_CONTENT.dualStandardParagraph,
    );
    expect(dualStandard.textContent).toBe(
      PASSPORT_PAGE_CONTENT.dualStandardParagraph,
    );
  });

  it('mentions both MS 2818 and MARI in the dual-standard paragraph', () => {
    renderWithProviders(<PassportHero />);
    const dualStandard = screen.getByTestId('passport-dual-standard');
    expect(dualStandard.textContent).toMatch(/MS 2818/);
    expect(dualStandard.textContent).toMatch(/MARI/);
    expect(dualStandard.textContent).toMatch(/EU Regulation 2023\/1542/);
  });

  it('renders the legacy product mark image', () => {
    renderWithProviders(<PassportHero />);
    const legacyMark = screen.getByTestId('passport-legacy-mark');
    expect(legacyMark).toHaveAttribute('src', '/logo-legacy.png');
    expect(legacyMark.getAttribute('alt')).toBeTruthy();
  });

  it('does not render the corporate Logo mark inside the hero', () => {
    renderWithProviders(<PassportHero />);
    const hero = screen.getByTestId('passport-hero');
    const corporateMarks = hero.querySelectorAll('img[alt="Ichnos Protocol"]');
    expect(corporateMarks.length).toBe(0);
  });

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<PassportHero />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
