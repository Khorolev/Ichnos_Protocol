import { describe, it, expect } from 'vitest';

import { renderWithProviders, screen } from '../../test-utils';
import CookieConsentBanner from './CookieConsentBanner';

describe('CookieConsentBanner', () => {
  it('renders the cookie consent banner', () => {
    renderWithProviders(<CookieConsentBanner />);

    expect(
      screen.getByText(/we use cookies to improve your experience/i),
    ).toBeInTheDocument();
  });

  it('shows accept button', () => {
    renderWithProviders(<CookieConsentBanner />);

    expect(screen.getByText('Accept')).toBeInTheDocument();
  });

  it('shows privacy policy link', () => {
    renderWithProviders(<CookieConsentBanner />);

    const link = screen.getByText('Privacy Policy');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/privacy');
  });
});
