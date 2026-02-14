import { useState } from 'react';

export default function Logo({ className = '' }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`fw-bold text-uppercase logo-fallback ${className}`}>
        ICHNOS PROTOCOL
      </span>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Ichnos Protocol"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
