import { axe } from 'vitest-axe';
import { renderWithProviders, screen, waitFor, cleanup } from '../../test-utils';
import PassportPage from './PassportPage';
import { PASSPORT_META } from '../../constants/seoMeta';

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

vi.mock('../organisms/ContactSection', () => ({
  default: () => <div data-testid="contact-section" />,
}));

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
      const meta = document.querySelector('meta[name="description"]');
      expect(meta).toHaveAttribute('content', PASSPORT_META.description);
    });
  });

  it('sets meta keywords', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[name="keywords"]');
      expect(meta).toHaveAttribute('content', PASSPORT_META.keywords);
    });
  });

  it('sets og:title meta tag', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[property="og:title"]');
      expect(meta).toHaveAttribute('content', PASSPORT_META.og.title);
    });
  });

  it('sets og:description meta tag', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[property="og:description"]');
      expect(meta).toHaveAttribute('content', PASSPORT_META.og.description);
    });
  });

  it('sets og:type meta tag', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[property="og:type"]');
      expect(meta).toHaveAttribute('content', PASSPORT_META.og.type);
    });
  });

  it('sets og:url meta tag', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[property="og:url"]');
      expect(meta).toHaveAttribute('content', PASSPORT_META.og.url);
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

  it('renders ContactSection component', () => {
    expect(screen.getByTestId('contact-section')).toBeInTheDocument();
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
