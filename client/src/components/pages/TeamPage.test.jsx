import { axe } from 'vitest-axe';
import { renderWithProviders, screen, waitFor, cleanup } from '../../test-utils';
import TeamPage from './TeamPage';
import { TEAM_META } from '../../constants/seoMeta';
import { TEAM_PAGE_HEADER } from '../../constants/teamContent';

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => true),
}));

vi.mock('../organisms/FounderProfile', () => ({
  default: () => <div data-testid="founder-profile">FounderProfile</div>,
}));

vi.mock('../organisms/CareerTimeline', () => ({
  default: () => <div data-testid="career-timeline">CareerTimeline</div>,
}));

vi.mock('../organisms/VisionStatement', () => ({
  default: () => <div data-testid="vision-statement">VisionStatement</div>,
}));

describe('TeamPage', () => {
  beforeEach(() => {
    renderWithProviders(<TeamPage />);
  });

  it('sets document title', async () => {
    await waitFor(() => {
      expect(document.title).toBe(TEAM_META.title);
    });
  });

  it('sets meta description', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[name="description"]');
      expect(meta).toHaveAttribute('content', TEAM_META.description);
    });
  });

  it('sets meta keywords', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[name="keywords"]');
      expect(meta).toHaveAttribute('content', TEAM_META.keywords);
    });
  });

  it('sets og:title meta tag', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[property="og:title"]');
      expect(meta).toHaveAttribute('content', TEAM_META.og.title);
    });
  });

  it('sets og:description meta tag', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[property="og:description"]');
      expect(meta).toHaveAttribute('content', TEAM_META.og.description);
    });
  });

  it('sets og:type meta tag', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[property="og:type"]');
      expect(meta).toHaveAttribute('content', TEAM_META.og.type);
    });
  });

  it('sets og:url meta tag', async () => {
    await waitFor(() => {
      const meta = document.querySelector('meta[property="og:url"]');
      expect(meta).toHaveAttribute('content', TEAM_META.og.url);
    });
  });

  it('renders page title', () => {
    expect(screen.getByText(TEAM_PAGE_HEADER.title)).toBeInTheDocument();
  });

  it('renders page subtitle', () => {
    expect(screen.getByText(TEAM_PAGE_HEADER.subtitle)).toBeInTheDocument();
  });

  it('renders FounderProfile component', () => {
    expect(screen.getByTestId('founder-profile')).toBeInTheDocument();
  });

  it('renders CareerTimeline component', () => {
    expect(screen.getByTestId('career-timeline')).toBeInTheDocument();
  });

  it('renders VisionStatement component', () => {
    expect(screen.getByTestId('vision-statement')).toBeInTheDocument();
  });

  it('has proper heading hierarchy with h1', () => {
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(TEAM_PAGE_HEADER.title);
  });

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<TeamPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
