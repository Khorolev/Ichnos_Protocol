import { axe } from 'vitest-axe';
import { renderWithProviders, screen, waitFor, cleanup } from '../../test-utils';
import ServicesPage from './ServicesPage';
import { SEO_META } from '../../constants/seo';
import { SERVICES_PAGE_CONTENT } from '../../constants/services';

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => true),
}));

vi.mock('../organisms/ServicesList', () => ({
  default: () => <div data-testid="services-list">ServicesList</div>,
}));

vi.mock('../organisms/FeatureMaturityMatrix', () => ({
  default: () => <div data-testid="feature-matrix">FeatureMaturityMatrix</div>,
}));

vi.mock('../organisms/TechnologyRoadmap', () => ({
  default: () => <div data-testid="tech-roadmap">TechnologyRoadmap</div>,
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
      expect(document.title).toBe(SEO_META.services.title);
    });
  });

  it('sets meta description', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[name="description"]');
      expect(meta).toHaveAttribute('content', SEO_META.services.description);
    });
  });

  it('sets meta keywords', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[name="keywords"]');
      expect(meta).toHaveAttribute('content', SEO_META.services.keywords);
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

  it('renders FeatureMaturityMatrix component', () => {
    expect(screen.getByTestId('feature-matrix')).toBeInTheDocument();
  });

  it('renders TechnologyRoadmap component', () => {
    expect(screen.getByTestId('tech-roadmap')).toBeInTheDocument();
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
