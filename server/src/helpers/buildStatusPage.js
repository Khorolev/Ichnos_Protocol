/**
 * Escapes HTML-special characters to prevent injection when interpolating
 * untrusted values (e.g. environment variables) into an HTML template.
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Returns the origin only when it uses a safe http/https scheme.
 * Falls back to an empty string to prevent javascript:/data: URI injection.
 */
function sanitizeOrigin(origin) {
  const str = String(origin ?? "");
  return /^https?:\/\//i.test(str) ? str : "";
}

/**
 * Builds the HTML status page shown at the API root (GET /).
 * Displays the Ichnos Protocol logo, server status, and key info.
 */
export default function buildStatusPage({ clientOrigin, env, nodeVersion }) {
  const safeOrigin = escapeHtml(sanitizeOrigin(clientOrigin));
  const logoUrl = safeOrigin ? `${safeOrigin}/logo.png` : "";
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ichnos Protocol API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif; background: #0a0a0a; color: #e0e0e0; display: flex;
      justify-content: center; align-items: center; min-height: 100vh; }
    .container { text-align: center; max-width: 480px; padding: 2rem; }
    .logo { width: 120px; height: 120px; margin-bottom: 1.5rem;
      border-radius: 16px; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; color: #fff; }
    .subtitle { color: #888; font-size: 0.9rem; margin-bottom: 2rem; }
    .status { display: inline-flex; align-items: center; gap: 0.5rem;
      background: #111; border: 1px solid #222; border-radius: 999px;
      padding: 0.5rem 1.25rem; font-size: 0.85rem; margin-bottom: 2rem; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e;
      box-shadow: 0 0 6px #22c55e; }
    .info { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;
      margin-bottom: 2rem; }
    .info-card { background: #111; border: 1px solid #222; border-radius: 8px;
      padding: 0.75rem; }
    .info-label { font-size: 0.7rem; color: #666; text-transform: uppercase;
      letter-spacing: 0.05em; }
    .info-value { font-size: 0.85rem; color: #ccc; margin-top: 0.25rem; }
    .links { display: flex; gap: 1rem; justify-content: center;
      flex-wrap: wrap; }
    .links a { color: #3b82f6; text-decoration: none; font-size: 0.8rem; }
    .links a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <img src="${logoUrl}" alt="Ichnos Protocol" class="logo"
      onerror="this.style.display='none'">
    <h1>Ichnos Protocol API</h1>
    <p class="subtitle">Battery Passport Platform</p>
    <div class="status"><span class="dot"></span> Server Online</div>
    <div class="info">
      <div class="info-card">
        <div class="info-label">Environment</div>
        <div class="info-value">${escapeHtml(env)}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Uptime</div>
        <div class="info-value">${hours}h ${minutes}m ${seconds}s</div>
      </div>
      <div class="info-card">
        <div class="info-label">Node.js</div>
        <div class="info-value">${escapeHtml(nodeVersion)}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Timestamp</div>
        <div class="info-value">${new Date().toISOString().slice(0, 19)}Z</div>
      </div>
    </div>
    <div class="links">
      <a href="/api/health">Health Check</a>
      <a href="${safeOrigin}">Website</a>
    </div>
  </div>
</body>
</html>`;
}
