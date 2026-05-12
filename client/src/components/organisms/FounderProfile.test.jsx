import { axe } from 'vitest-axe';
import { renderWithProviders, screen, cleanup, fireEvent } from '../../test-utils';
import FounderProfile from './FounderProfile';

vi.mock('./CareerTimeline', () => ({
  default: ({ timeline }) => (
    <div data-testid="career-timeline" data-count={timeline?.length ?? 0} />
  ),
}));

describe('FounderProfile', () => {
  const MEMBER = {
    id: 'test-member',
    name: 'Test Person',
    title: 'Test Title',
    photo: '/test.png',
    bio: ['Para one.', 'Para two.'],
    showTimeline: true,
    timeline: [
      {
        id: 't1',
        year: 2020,
        title: 't',
        organization: 'o',
        description: 'd',
      },
    ],
  };

  it("renders the given member's name, title, and each bio paragraph", () => {
    renderWithProviders(<FounderProfile member={MEMBER} />);
    expect(screen.getByText(MEMBER.name)).toBeInTheDocument();
    expect(screen.getByText(MEMBER.title)).toBeInTheDocument();
    expect(screen.getByText('Para one.')).toBeInTheDocument();
    expect(screen.getByText('Para two.')).toBeInTheDocument();
  });

  it('renders the photo with src and alt from the member prop', () => {
    renderWithProviders(<FounderProfile member={MEMBER} />);
    const img = screen.getByAltText(MEMBER.name);
    expect(img).toHaveAttribute('src', MEMBER.photo);
  });

  it('renders CareerTimeline when showTimeline is true', () => {
    renderWithProviders(<FounderProfile member={MEMBER} />);
    expect(screen.getByTestId('career-timeline')).toBeInTheDocument();
  });

  it('does not render CareerTimeline when showTimeline is false', () => {
    const hidden = { ...MEMBER, showTimeline: false };
    renderWithProviders(<FounderProfile member={hidden} />);
    expect(screen.queryByTestId('career-timeline')).not.toBeInTheDocument();
  });

  it('shows the fallback when the photo image errors out', () => {
    renderWithProviders(<FounderProfile member={MEMBER} />);
    const img = screen.getByAltText(MEMBER.name);
    fireEvent.error(img);
    expect(document.querySelector('.founder-photo-fallback')).toBeInTheDocument();
    expect(screen.queryByAltText(MEMBER.name)).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<FounderProfile member={MEMBER} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
