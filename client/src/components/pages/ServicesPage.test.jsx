import { axe } from 'vitest-axe';
import { renderWithProviders, screen, waitFor, cleanup, within } from '../../test-utils';
import ServicesPage from './ServicesPage';
import { SERVICES_META } from '../../constants/seoMeta';
import { PAGE_STRUCTURED_DATA } from '../../constants/structuredData';
import {
  SERVICES_PAGE_CONTENT,
  SERVICE_PILLARS,
  getServicesByPillar,
} from '../../constants/services';

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => true),
}));

vi.mock('../../hooks/useScrollToSection', () => ({
  useScrollToSection: vi.fn(),
}));

vi.mock('../organisms/ContactSection', () => ({
  default: () => <div data-testid="contact-section">ContactSection</div>,
}));

import { useScrollToSection } from '../../hooks/useScrollToSection';

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

  it('renders ContactSection component', () => {
    expect(screen.getByTestId('contact-section')).toBeInTheDocument();
  });

  it('has proper heading hierarchy with h1', () => {
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(SERVICES_PAGE_CONTENT.title);
  });

  it('calls useScrollToSection hook', () => {
    expect(useScrollToSection).toHaveBeenCalled();
  });

  it('renders all three section ids: engineering, compliance, circularity', () => {
    ['engineering', 'compliance', 'circularity'].forEach((sectionId) => {
      expect(document.getElementById(sectionId)).not.toBeNull();
    });
  });

  it('does not render a delivery-models section any more (Technical Lead now lives in Engineering)', () => {
    expect(document.getElementById('delivery-models')).toBeNull();
  });

  it('renders exactly three services-group sections', () => {
    const sections = document.querySelectorAll('section.services-group');
    expect(sections.length).toBe(3);
  });

  it('does not render service cards under the wrong pillar section', () => {
    const pillarIds = ['engineering', 'compliance', 'circularity'];
    pillarIds.forEach((pillarId) => {
      const section = document.getElementById(pillarId);
      const ownTitles = new Set(
        getServicesByPillar(pillarId).map((s) => s.title),
      );
      const foreignServices = SERVICE_PILLARS.flatMap((p) =>
        p.id === pillarId ? [] : getServicesByPillar(p.id),
      );
      foreignServices.forEach((service) => {
        if (ownTitles.has(service.title)) return;
        expect(
          within(section).queryByText(service.title, {
            selector: '.service-card-title',
          }),
        ).toBeNull();
      });
    });
  });

  it('renders the three sections in locked order', () => {
    const engineering = document.getElementById('engineering');
    const compliance = document.getElementById('compliance');
    const circularity = document.getElementById('circularity');

    expect(
      engineering.compareDocumentPosition(compliance) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      compliance.compareDocumentPosition(circularity) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders ContactSection after the three section groups', () => {
    const circularity = document.getElementById('circularity');
    const contact = screen.getByTestId('contact-section');
    expect(
      circularity.compareDocumentPosition(contact) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders Technical Lead under the Engineering pillar section', () => {
    const engineering = document.getElementById('engineering');
    expect(
      within(engineering).getByText('Technical Lead — Battery Systems', {
        selector: '.service-card-title',
      }),
    ).toBeInTheDocument();
  });

  it.each(SERVICE_PILLARS)(
    'renders the correct service titles under the $anchor section',
    (pillar) => {
      const section = document.getElementById(pillar.anchor);
      expect(section).not.toBeNull();
      const services = getServicesByPillar(pillar.id);
      services.forEach((service) => {
        expect(
          within(section).getByText(service.title, {
            selector: '.service-card-title',
          }),
        ).toBeInTheDocument();
      });
    },
  );

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<ServicesPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
