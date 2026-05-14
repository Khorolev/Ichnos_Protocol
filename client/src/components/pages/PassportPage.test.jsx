import { axe } from 'vitest-axe';
import { renderWithProviders, screen, waitFor, cleanup } from '../../test-utils';
import PassportPage from './PassportPage';
import { PASSPORT_META } from '../../constants/seoMeta';
import { PAGE_STRUCTURED_DATA } from '../../constants/structuredData';
import {
  PASSPORT_NARRATIVE_CONTENT,
  PASSPORT_VALUE_PROPS,
} from '../../constants/passportContent';

vi.mock('../organisms/PassportHero', () => ({
  default: () => (
    <div data-testid="passport-hero">
      <h1>Battery Passport</h1>
    </div>
  ),
}));

vi.mock('../organisms/FeatureMaturityMatrix', () => ({
  default: () => <div data-testid="feature-maturity-matrix" />,
}));

vi.mock('../organisms/TechnologyRoadmap', () => ({
  default: () => <div data-testid="technology-roadmap" />,
}));

vi.mock('../organisms/PassportContactCta', () => ({
  default: () => <div data-testid="passport-contact-cta" />,
}));

const PRECEDES = 0x04; // Node.DOCUMENT_POSITION_FOLLOWING

describe('PassportPage', () => {
  beforeEach(() => {
    renderWithProviders(<PassportPage />);
  });

  it('sets document title', async () => {
    await waitFor(() => {
      expect(document.title).toBe(PASSPORT_META.title);
    });
  });

  it('sets meta description', async () => {
    await waitFor(() => {
      const meta = document.querySelector(
        'meta[name="description"][data-rh="true"]',
      );
      expect(meta).toHaveAttribute('content', PASSPORT_META.description);
    });
  });

  it('sets meta keywords', async () => {
    await waitFor(() => {
      const meta = document.querySelector(
        'meta[name="keywords"][data-rh="true"]',
      );
      expect(meta).toHaveAttribute('content', PASSPORT_META.keywords);
    });
  });

  it('sets canonical link', async () => {
    await waitFor(() => {
      const link = document.querySelector(
        'link[rel="canonical"][data-rh="true"]',
      );
      expect(link).toHaveAttribute('href', PASSPORT_META.canonical);
    });
  });

  it('sets og meta tags', async () => {
    await waitFor(() => {
      expect(
        document.querySelector('meta[property="og:title"][data-rh="true"]'),
      ).toHaveAttribute('content', PASSPORT_META.og.title);
      expect(
        document.querySelector(
          'meta[property="og:description"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', PASSPORT_META.og.description);
      expect(
        document.querySelector('meta[property="og:type"][data-rh="true"]'),
      ).toHaveAttribute('content', PASSPORT_META.og.type);
      expect(
        document.querySelector('meta[property="og:url"][data-rh="true"]'),
      ).toHaveAttribute('content', PASSPORT_META.og.url);
      expect(
        document.querySelector(
          'meta[property="og:site_name"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', PASSPORT_META.og.siteName);
      expect(
        document.querySelector('meta[property="og:locale"][data-rh="true"]'),
      ).toHaveAttribute('content', PASSPORT_META.og.locale);
      expect(
        document.querySelector('meta[property="og:image"][data-rh="true"]'),
      ).toHaveAttribute('content', PASSPORT_META.og.image);
      expect(
        document.querySelector(
          'meta[property="og:image:alt"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', PASSPORT_META.og.imageAlt);
    });
  });

  it('sets twitter meta tags', async () => {
    await waitFor(() => {
      expect(
        document.querySelector('meta[name="twitter:card"][data-rh="true"]'),
      ).toHaveAttribute('content', PASSPORT_META.twitter.card);
      expect(
        document.querySelector('meta[name="twitter:title"][data-rh="true"]'),
      ).toHaveAttribute('content', PASSPORT_META.twitter.title);
      expect(
        document.querySelector(
          'meta[name="twitter:description"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', PASSPORT_META.twitter.description);
      expect(
        document.querySelector('meta[name="twitter:image"][data-rh="true"]'),
      ).toHaveAttribute('content', PASSPORT_META.twitter.image);
      expect(
        document.querySelector(
          'meta[name="twitter:image:alt"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', PASSPORT_META.twitter.imageAlt);
    });
  });

  it('emits JSON-LD schemas from PAGE_STRUCTURED_DATA.passport', async () => {
    await waitFor(() => {
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"][data-rh="true"]',
      );
      expect(scripts.length).toBe(PAGE_STRUCTURED_DATA.passport.length);
      expect(JSON.parse(scripts[0].textContent)).toEqual(
        PAGE_STRUCTURED_DATA.passport[0],
      );
    });
  });

  it('renders PassportHero component', () => {
    expect(screen.getByTestId('passport-hero')).toBeInTheDocument();
  });

  it('renders FeatureMaturityMatrix component', () => {
    expect(screen.getByTestId('feature-maturity-matrix')).toBeInTheDocument();
  });

  it('renders TechnologyRoadmap component', () => {
    expect(screen.getByTestId('technology-roadmap')).toBeInTheDocument();
  });

  it('renders PassportContactCta component', () => {
    expect(screen.getByTestId('passport-contact-cta')).toBeInTheDocument();
  });

  it('renders sections in the correct order: narrative → value-props → cta', () => {
    const narrative = screen.getByTestId('passport-narrative');
    const valueProps = screen.getByTestId('passport-value-props');
    const cta = screen.getByTestId('passport-contact-cta');
    expect(narrative.compareDocumentPosition(valueProps) & PRECEDES).toBeTruthy();
    expect(valueProps.compareDocumentPosition(cta) & PRECEDES).toBeTruthy();
  });

  it('renders the narrative heading and body from passport content', () => {
    const narrative = screen.getByTestId('passport-narrative');
    expect(narrative).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: PASSPORT_NARRATIVE_CONTENT.heading,
      }),
    ).toBeInTheDocument();
    expect(narrative).toHaveTextContent(PASSPORT_NARRATIVE_CONTENT.body);
  });

  it('renders the value-props heading and subtext', () => {
    const valueProps = screen.getByTestId('passport-value-props');
    expect(valueProps).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: PASSPORT_VALUE_PROPS.heading,
      }),
    ).toBeInTheDocument();
    expect(valueProps).toHaveTextContent(PASSPORT_VALUE_PROPS.subtext);
  });

  it('renders the OEM audience value card with its headline and points', () => {
    const [oem, recycler] = PASSPORT_VALUE_PROPS.audiences;
    const oemCard = screen.getByTestId(`passport-value-${oem.id}`);
    expect(oemCard).toBeInTheDocument();
    expect(oemCard).toHaveTextContent(oem.audience);
    expect(oemCard).toHaveTextContent(oem.headline);
    oem.points.forEach((point) => {
      expect(oemCard).toHaveTextContent(point);
    });
    expect(oemCard).not.toHaveTextContent(recycler.headline);
  });

  it('renders the recycler audience value card with its headline and points', () => {
    const [, recycler] = PASSPORT_VALUE_PROPS.audiences;
    const recyclerCard = screen.getByTestId(`passport-value-${recycler.id}`);
    expect(recyclerCard).toBeInTheDocument();
    expect(recyclerCard).toHaveTextContent(recycler.audience);
    expect(recyclerCard).toHaveTextContent(recycler.headline);
    recycler.points.forEach((point) => {
      expect(recyclerCard).toHaveTextContent(point);
    });
  });

  it('has proper heading hierarchy with h1', () => {
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Battery Passport');
  });

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<PassportPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
