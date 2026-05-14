import { axe } from 'vitest-axe';
import { renderWithProviders, screen, waitFor } from '../../test-utils';
import LandingPage from './LandingPage';
import { LANDING_META } from '../../constants/seoMeta';
import { PAGE_STRUCTURED_DATA } from '../../constants/structuredData';

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => true),
}));

vi.mock('../../hooks/useScrollToSection', () => ({
  useScrollToSection: vi.fn(),
}));

vi.mock('../organisms/Hero', () => ({
  default: () => <div data-testid="hero">Hero</div>,
}));

vi.mock('../organisms/ServicesSnapshot', () => ({
  default: () => <div data-testid="services-snapshot">ServicesSnapshot</div>,
}));

vi.mock('../organisms/CompanySnapshot', () => ({
  default: () => <div data-testid="company-snapshot">CompanySnapshot</div>,
}));

vi.mock('../organisms/PassportTeaser', () => ({
  default: () => <div data-testid="passport-teaser">PassportTeaser</div>,
}));

vi.mock('../organisms/ContactSection', () => ({
  default: () => <div data-testid="contact-section">ContactSection</div>,
}));

import { useScrollToSection } from '../../hooks/useScrollToSection';

describe('LandingPage', () => {
  beforeEach(() => {
    renderWithProviders(<LandingPage />);
  });

  it('sets document title', async () => {
    await waitFor(() => {
      expect(document.title).toBe(LANDING_META.title);
    });
  });

  it('sets meta description', async () => {
    await waitFor(() => {
      const meta = document.querySelector(
        'meta[name="description"][data-rh="true"]',
      );
      expect(meta).toHaveAttribute('content', LANDING_META.description);
    });
  });

  it('sets meta keywords', async () => {
    await waitFor(() => {
      const meta = document.querySelector(
        'meta[name="keywords"][data-rh="true"]',
      );
      expect(meta).toHaveAttribute('content', LANDING_META.keywords);
    });
  });

  it('sets canonical link', async () => {
    await waitFor(() => {
      const link = document.querySelector(
        'link[rel="canonical"][data-rh="true"]',
      );
      expect(link).toHaveAttribute('href', LANDING_META.canonical);
    });
  });

  it('sets all og meta tags', async () => {
    await waitFor(() => {
      expect(
        document.querySelector('meta[property="og:title"][data-rh="true"]'),
      ).toHaveAttribute('content', LANDING_META.og.title);
      expect(
        document.querySelector(
          'meta[property="og:description"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', LANDING_META.og.description);
      expect(
        document.querySelector('meta[property="og:type"][data-rh="true"]'),
      ).toHaveAttribute('content', LANDING_META.og.type);
      expect(
        document.querySelector('meta[property="og:url"][data-rh="true"]'),
      ).toHaveAttribute('content', LANDING_META.og.url);
      expect(
        document.querySelector(
          'meta[property="og:site_name"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', LANDING_META.og.siteName);
      expect(
        document.querySelector('meta[property="og:locale"][data-rh="true"]'),
      ).toHaveAttribute('content', LANDING_META.og.locale);
      expect(
        document.querySelector('meta[property="og:image"][data-rh="true"]'),
      ).toHaveAttribute('content', LANDING_META.og.image);
      expect(
        document.querySelector(
          'meta[property="og:image:alt"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', LANDING_META.og.imageAlt);
    });
  });

  it('sets all twitter meta tags', async () => {
    await waitFor(() => {
      expect(
        document.querySelector('meta[name="twitter:card"][data-rh="true"]'),
      ).toHaveAttribute('content', LANDING_META.twitter.card);
      expect(
        document.querySelector('meta[name="twitter:title"][data-rh="true"]'),
      ).toHaveAttribute('content', LANDING_META.twitter.title);
      expect(
        document.querySelector(
          'meta[name="twitter:description"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', LANDING_META.twitter.description);
      expect(
        document.querySelector('meta[name="twitter:image"][data-rh="true"]'),
      ).toHaveAttribute('content', LANDING_META.twitter.image);
      expect(
        document.querySelector(
          'meta[name="twitter:image:alt"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', LANDING_META.twitter.imageAlt);
    });
  });

  it('emits JSON-LD schemas from PAGE_STRUCTURED_DATA.landing', async () => {
    await waitFor(() => {
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"][data-rh="true"]',
      );
      expect(scripts.length).toBe(PAGE_STRUCTURED_DATA.landing.length);
      expect(JSON.parse(scripts[0].textContent)).toEqual(
        PAGE_STRUCTURED_DATA.landing[0],
      );
    });
  });

  it('renders Hero component', () => {
    expect(screen.getByTestId('hero')).toBeInTheDocument();
  });

  it('renders ServicesSnapshot component', () => {
    expect(screen.getByTestId('services-snapshot')).toBeInTheDocument();
  });

  it('renders CompanySnapshot component', () => {
    expect(screen.getByTestId('company-snapshot')).toBeInTheDocument();
  });

  it('renders PassportTeaser component', () => {
    expect(screen.getByTestId('passport-teaser')).toBeInTheDocument();
  });

  it('renders ContactSection component', () => {
    expect(screen.getByTestId('contact-section')).toBeInTheDocument();
  });

  it('renders sections in order: Hero, ServicesSnapshot, CompanySnapshot, PassportTeaser, ContactSection', () => {
    const hero = screen.getByTestId('hero');
    const services = screen.getByTestId('services-snapshot');
    const company = screen.getByTestId('company-snapshot');
    const passport = screen.getByTestId('passport-teaser');
    const contact = screen.getByTestId('contact-section');

    expect(
      hero.compareDocumentPosition(services) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      services.compareDocumentPosition(company) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      company.compareDocumentPosition(passport) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      passport.compareDocumentPosition(contact) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('calls useScrollToSection hook', () => {
    expect(useScrollToSection).toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<LandingPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
