import { useState } from 'react';

const LOGO_SOURCES = {
  advisory: '/logo.png',
  passport: '/logo-legacy.png',
};

export default function Logo({ className = '', theme = 'advisory' }) {
  const [failed, setFailed] = useState(false);
  const src = LOGO_SOURCES[theme] ?? LOGO_SOURCES.advisory;

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
