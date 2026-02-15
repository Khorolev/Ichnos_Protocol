import { axe } from 'vitest-axe';
import { renderWithProviders, screen, waitFor } from '../../test-utils';
import LandingPage from './LandingPage';
import { LANDING_META } from '../../constants/seoMeta';

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => true),
}));

vi.mock('../../hooks/useScrollToSection', () => ({
  useScrollToSection: vi.fn(),
}));

vi.mock('../organisms/Hero', () => ({
  default: () => <div data-testid="hero">Hero</div>,
}));

vi.mock('../organisms/ProblemStatement', () => ({
  default: () => <div data-testid="problem-statement">ProblemStatement</div>,
}));

vi.mock('../organisms/SolutionOverview', () => ({
  default: () => <div data-testid="solution-overview">SolutionOverview</div>,
}));

vi.mock('../organisms/WhyIchnos', () => ({
  default: () => <div data-testid="why-ichnos">WhyIchnos</div>,
}));

vi.mock('../organisms/ServicesSnapshot', () => ({
  default: () => <div data-testid="services-snapshot">ServicesSnapshot</div>,
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
      const meta = document.querySelector('meta[name="description"]');
      expect(meta).toHaveAttribute('content', LANDING_META.description);
    });
  });

  it('sets meta keywords', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[name="keywords"]');
      expect(meta).toHaveAttribute('content', LANDING_META.keywords);
    });
  });

  it('sets og:title meta tag', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[property="og:title"]');
      expect(meta).toHaveAttribute('content', LANDING_META.og.title);
    });
  });

  it('sets og:description meta tag', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[property="og:description"]');
      expect(meta).toHaveAttribute('content', LANDING_META.og.description);
    });
  });

  it('sets og:type meta tag', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[property="og:type"]');
      expect(meta).toHaveAttribute('content', LANDING_META.og.type);
    });
  });

  it('sets og:url meta tag', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[property="og:url"]');
      expect(meta).toHaveAttribute('content', LANDING_META.og.url);
    });
  });

  it('renders Hero component', () => {
    expect(screen.getByTestId('hero')).toBeInTheDocument();
  });

  it('renders ProblemStatement component', () => {
    expect(screen.getByTestId('problem-statement')).toBeInTheDocument();
  });

  it('renders SolutionOverview component', () => {
    expect(screen.getByTestId('solution-overview')).toBeInTheDocument();
  });

  it('renders WhyIchnos component', () => {
    expect(screen.getByTestId('why-ichnos')).toBeInTheDocument();
  });

  it('renders ServicesSnapshot component', () => {
    expect(screen.getByTestId('services-snapshot')).toBeInTheDocument();
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
