import ReactCookieConsent from 'react-cookie-consent';

const BANNER_STYLE = {
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  padding: 'var(--spacing-md) var(--spacing-lg)',
  zIndex: 'var(--z-tooltip)',
};

const BUTTON_STYLE = {
  background: 'var(--color-primary)',
  color: '#fff',
  borderRadius: '6px',
  padding: '8px 24px',
  border: 'none',
  fontWeight: 'var(--font-weight-medium)',
};

export default function CookieConsentBanner() {
  return (
    <ReactCookieConsent
      location="bottom"
      buttonText="Accept cookies"
      cookieName="ichnos_cookie_consent"
      style={BANNER_STYLE}
      buttonStyle={BUTTON_STYLE}
      expires={365}
    >
      We use cookies to improve your experience. By continuing, you
      accept our cookie policy.{' '}
      <a href="/privacy" className="cookie-consent-link" data-testid="cookie-consent-link">
        Privacy Policy
      </a>
    </ReactCookieConsent>
  );
}
