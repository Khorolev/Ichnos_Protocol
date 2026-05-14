import { useState } from 'react';

const LOGO_SOURCES = {
  light: '/logo-dark.png',
  dark: '/logo.png',
  advisory: '/logo-dark.png',
  passport: '/logo.png',
};

export default function Logo({ className = '', theme = 'light' }) {
  const [failed, setFailed] = useState(false);
  const src = LOGO_SOURCES[theme] ?? LOGO_SOURCES.light;

  if (failed) {
    return (
      <span className={`fw-bold text-uppercase logo-fallback ${className}`}>
        ICHNOS PROTOCOL
      </span>
    );
  }

  return (
    <img
      src={src}
      alt="Ichnos Protocol"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
