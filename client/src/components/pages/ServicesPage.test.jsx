import { axe } from 'vitest-axe';
import { renderWithProviders, screen, waitFor, cleanup } from '../../test-utils';
import ServicesPage from './ServicesPage';
import { SERVICES_META } from '../../constants/seoMeta';
import { PAGE_STRUCTURED_DATA } from '../../constants/structuredData';
import { SERVICES_PAGE_CONTENT } from '../../constants/services';

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => true),
}));

vi.mock('../organisms/ServicesList', () => ({
  default: () => <div data-testid="services-list">ServicesList</div>,
}));

vi.mock('../organisms/ContactSection', () => ({
  default: () => <div data-testid="contact-section">ContactSection</div>,
}));

describe('ServicesPage', () => {
  beforeEach(() => {
    renderWithProviders(<ServicesPage />);
  });

  it('sets document title', async () => {
    await waitFor(() => {
      expect(document.title).toBe(SERVICES_META.title);
    });
  });

  it('sets meta description', async () => {
    await waitFor(() => {
      const meta = document.querySelector(
        'meta[name="description"][data-rh="true"]',
      );
      expect(meta).toHaveAttribute('content', SERVICES_META.description);
    });
  });

  it('sets meta keywords', async () => {
    await waitFor(() => {
      const meta = document.querySelector(
        'meta[name="keywords"][data-rh="true"]',
      );
      expect(meta).toHaveAttribute('content', SERVICES_META.keywords);
    });
  });

  it('sets canonical link', async () => {
    await waitFor(() => {
      expect(
        document.querySelector('link[rel="canonical"][data-rh="true"]'),
      ).toHaveAttribute('href', SERVICES_META.canonical);
    });
  });

  it('sets all og meta tags', async () => {
    await waitFor(() => {
      expect(
        document.querySelector('meta[property="og:title"][data-rh="true"]'),
      ).toHaveAttribute('content', SERVICES_META.og.title);
      expect(
        document.querySelector(
          'meta[property="og:description"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', SERVICES_META.og.description);
      expect(
        document.querySelector('meta[property="og:type"][data-rh="true"]'),
      ).toHaveAttribute('content', SERVICES_META.og.type);
      expect(
        document.querySelector('meta[property="og:url"][data-rh="true"]'),
      ).toHaveAttribute('content', SERVICES_META.og.url);
      expect(
        document.querySelector(
          'meta[property="og:site_name"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', SERVICES_META.og.siteName);
      expect(
        document.querySelector('meta[property="og:locale"][data-rh="true"]'),
      ).toHaveAttribute('content', SERVICES_META.og.locale);
      expect(
        document.querySelector('meta[property="og:image"][data-rh="true"]'),
      ).toHaveAttribute('content', SERVICES_META.og.image);
      expect(
        document.querySelector(
          'meta[property="og:image:alt"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', SERVICES_META.og.imageAlt);
    });
  });

  it('sets all twitter meta tags', async () => {
    await waitFor(() => {
      expect(
        document.querySelector('meta[name="twitter:card"][data-rh="true"]'),
      ).toHaveAttribute('content', SERVICES_META.twitter.card);
      expect(
        document.querySelector('meta[name="twitter:title"][data-rh="true"]'),
      ).toHaveAttribute('content', SERVICES_META.twitter.title);
      expect(
        document.querySelector(
          'meta[name="twitter:description"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', SERVICES_META.twitter.description);
      expect(
        document.querySelector('meta[name="twitter:image"][data-rh="true"]'),
      ).toHaveAttribute('content', SERVICES_META.twitter.image);
      expect(
        document.querySelector(
          'meta[name="twitter:image:alt"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', SERVICES_META.twitter.imageAlt);
    });
  });

  it('emits JSON-LD schemas from PAGE_STRUCTURED_DATA.services', async () => {
    await waitFor(() => {
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"][data-rh="true"]',
      );
      expect(scripts.length).toBe(PAGE_STRUCTURED_DATA.services.length);
      expect(JSON.parse(scripts[0].textContent)).toEqual(
        PAGE_STRUCTURED_DATA.services[0],
      );
    });
  });

  it('renders page title', () => {
    expect(screen.getByText(SERVICES_PAGE_CONTENT.title)).toBeInTheDocument();
  });

  it('renders page subtitle', () => {
    expect(screen.getByText(SERVICES_PAGE_CONTENT.subtitle)).toBeInTheDocument();
  });

  it('renders ServicesList component', () => {
    expect(screen.getByTestId('services-list')).toBeInTheDocument();
  });

  it('renders ContactSection component', () => {
    expect(screen.getByTestId('contact-section')).toBeInTheDocument();
  });

  it('has proper heading hierarchy with h1', () => {
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(SERVICES_PAGE_CONTENT.title);
  });

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<ServicesPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
