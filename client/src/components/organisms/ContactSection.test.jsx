import { axe } from 'vitest-axe';
import { renderWithProviders, screen, cleanup } from '../../test-utils';

const { mockChatPanel } = vi.hoisted(() => ({
  mockChatPanel: vi.fn(() => <div data-testid="chat-panel" />),
}));

vi.mock('../molecules/ChatPanel', () => ({
  default: (props) => mockChatPanel(props),
}));

import ContactSection from './ContactSection';
import {
  CONTACT_INFO,
  CONTACT_SECTION_CONTENT,
} from '../../constants/companyInfo';

describe('ContactSection', () => {
  beforeEach(() => {
    mockChatPanel.mockClear();
  });

  it('renders heading, subhead, and address line', () => {
    renderWithProviders(<ContactSection />);
    expect(
      screen.getByRole('heading', { name: CONTACT_SECTION_CONTENT.heading }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(CONTACT_SECTION_CONTENT.subhead),
    ).toBeInTheDocument();
    expect(
      screen.getByText(CONTACT_SECTION_CONTENT.addressLine),
    ).toBeInTheDocument();
  });

  it('renders the four touchpoint links with correct hrefs', () => {
    renderWithProviders(<ContactSection />);
    expect(
      screen.getByRole('link', { name: CONTACT_INFO.email }),
    ).toHaveAttribute('href', `mailto:${CONTACT_INFO.email}`);
    expect(
      screen.getByRole('link', {
        name: CONTACT_SECTION_CONTENT.links.linkedInCompany,
      }),
    ).toHaveAttribute('href', CONTACT_INFO.linkedInCompany);
    expect(
      screen.getByRole('link', {
        name: CONTACT_SECTION_CONTENT.links.linkedInFounder,
      }),
    ).toHaveAttribute('href', CONTACT_INFO.linkedInFounder);
    expect(
      screen.getByRole('link', {
        name: CONTACT_SECTION_CONTENT.links.bookCall,
      }),
    ).toHaveAttribute('href', CONTACT_INFO.calendly);
  });

  it('mounts ChatPanel inline with persistState=false by default', () => {
    renderWithProviders(<ContactSection />);
    expect(mockChatPanel).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'inline', persistState: false }),
    );
  });

  it('forwards persistChat=true to ChatPanel as persistState=true', () => {
    renderWithProviders(<ContactSection persistChat={true} />);
    expect(mockChatPanel).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'inline', persistState: true }),
    );
  });

  it('does not render "Open the full contact page →" link by default', () => {
    renderWithProviders(<ContactSection />);
    expect(
      screen.queryByTestId('contact-section-full-link'),
    ).not.toBeInTheDocument();
  });

  it('renders "Open the full contact page →" link when showFullContactLink=true', () => {
    renderWithProviders(<ContactSection showFullContactLink={true} />);
    const link = screen.getByTestId('contact-section-full-link');
    expect(link).toHaveAttribute('href', '/contact');
    expect(link).toHaveTextContent('Open the full contact page →');
  });

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<ContactSection />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
