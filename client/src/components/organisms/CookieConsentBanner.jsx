import ReactCookieConsent from 'react-cookie-consent';

export default function CookieConsentBanner() {
  return (
    <ReactCookieConsent
      location="bottom"
      buttonText="Accept cookies"
      cookieName="ichnos_cookie_consent"
      containerClasses="cookie-consent-banner"
      buttonClasses="cookie-consent-button"
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
