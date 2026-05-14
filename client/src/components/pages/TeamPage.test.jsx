import { axe } from 'vitest-axe';
import { renderWithProviders, screen, waitFor, cleanup } from '../../test-utils';
import TeamPage from './TeamPage';
import { TEAM_META } from '../../constants/seoMeta';
import { PAGE_STRUCTURED_DATA } from '../../constants/structuredData';
import {
  TEAM_MEMBERS,
  TEAM_PAGE_HEADER,
} from '../../constants/teamContent';

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => true),
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
      const meta = document.querySelector(
        'meta[name="description"][data-rh="true"]',
      );
      expect(meta).toHaveAttribute('content', TEAM_META.description);
    });
  });

  it('sets meta keywords', async () => {
    await waitFor(() => {
      const meta = document.querySelector(
        'meta[name="keywords"][data-rh="true"]',
      );
      expect(meta).toHaveAttribute('content', TEAM_META.keywords);
    });
  });

  it('sets canonical link', async () => {
    await waitFor(() => {
      expect(
        document.querySelector('link[rel="canonical"][data-rh="true"]'),
      ).toHaveAttribute('href', TEAM_META.canonical);
    });
  });

  it('sets all og meta tags', async () => {
    await waitFor(() => {
      expect(
        document.querySelector('meta[property="og:title"][data-rh="true"]'),
      ).toHaveAttribute('content', TEAM_META.og.title);
      expect(
        document.querySelector(
          'meta[property="og:description"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', TEAM_META.og.description);
      expect(
        document.querySelector('meta[property="og:type"][data-rh="true"]'),
      ).toHaveAttribute('content', TEAM_META.og.type);
      expect(
        document.querySelector('meta[property="og:url"][data-rh="true"]'),
      ).toHaveAttribute('content', TEAM_META.og.url);
      expect(
        document.querySelector(
          'meta[property="og:site_name"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', TEAM_META.og.siteName);
      expect(
        document.querySelector('meta[property="og:locale"][data-rh="true"]'),
      ).toHaveAttribute('content', TEAM_META.og.locale);
      expect(
        document.querySelector('meta[property="og:image"][data-rh="true"]'),
      ).toHaveAttribute('content', TEAM_META.og.image);
      expect(
        document.querySelector(
          'meta[property="og:image:alt"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', TEAM_META.og.imageAlt);
    });
  });

  it('sets all twitter meta tags', async () => {
    await waitFor(() => {
      expect(
        document.querySelector('meta[name="twitter:card"][data-rh="true"]'),
      ).toHaveAttribute('content', TEAM_META.twitter.card);
      expect(
        document.querySelector('meta[name="twitter:title"][data-rh="true"]'),
      ).toHaveAttribute('content', TEAM_META.twitter.title);
      expect(
        document.querySelector(
          'meta[name="twitter:description"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', TEAM_META.twitter.description);
      expect(
        document.querySelector('meta[name="twitter:image"][data-rh="true"]'),
      ).toHaveAttribute('content', TEAM_META.twitter.image);
      expect(
        document.querySelector(
          'meta[name="twitter:image:alt"][data-rh="true"]',
        ),
      ).toHaveAttribute('content', TEAM_META.twitter.imageAlt);
    });
  });

  it('emits JSON-LD schemas from PAGE_STRUCTURED_DATA.team', async () => {
    await waitFor(() => {
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"][data-rh="true"]',
      );
      expect(scripts.length).toBe(PAGE_STRUCTURED_DATA.team.length);
      expect(JSON.parse(scripts[0].textContent)).toEqual(
        PAGE_STRUCTURED_DATA.team[0],
      );
    });
  });

  it('renders page title', () => {
    expect(screen.getByText(TEAM_PAGE_HEADER.title)).toBeInTheDocument();
  });

  it('renders page subtitle', () => {
    expect(screen.getByText(TEAM_PAGE_HEADER.subtitle)).toBeInTheDocument();
  });

  it('renders one FounderProfile per team member with correct names', () => {
    TEAM_MEMBERS.forEach((member) => {
      expect(
        screen.getByRole('heading', { level: 2, name: member.name }),
      ).toBeInTheDocument();
    });
  });

  it('renders the recognition block for Francesco', () => {
    const blocks = screen.getAllByTestId('recognition-block');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toHaveTextContent('Recognition');
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
