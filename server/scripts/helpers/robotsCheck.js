/**
 * Robots.txt compliance checker for web scraping scripts.
 *
 * Fetches and parses robots.txt disallow rules, checking whether
 * a given URL path is permitted for the script's user-agent.
 *
 * @module robotsCheck
 */

const ROBOTS_TIMEOUT_MS = 5_000;
const USER_AGENT = "IchnosProtocol-KnowledgeBot/1.0";

/**
 * Parse robots.txt content into disallow rules.
 *
 * @param {string} robotsTxt - Raw robots.txt content
 * @returns {{agent: string, path: string}[]} Parsed disallow rules
 */
function parseRobotsTxt(robotsTxt) {
  const lines = robotsTxt.split("\n").map((l) => l.trim());
  const rules = [];
  let currentAgents = [];

  for (const line of lines) {
    if (line.startsWith("#") || line === "") {
      if (line === "") currentAgents = [];
      continue;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const directive = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (directive === "user-agent") {
      currentAgents.push(value);
    } else if (directive === "disallow" && value) {
      for (const agent of currentAgents) {
        rules.push({ agent, path: value });
      }
    }
  }

  return rules;
}

/**
 * Check if a path is disallowed by robots.txt rules.
 *
 * @param {{agent: string, path: string}[]} rules - Parsed rules
 * @param {string} userAgent - The bot's user-agent string
 * @param {string} path - URL path to check
 * @returns {boolean} True if path is disallowed
 */
function isPathDisallowed(rules, userAgent, path) {
  const ua = userAgent.toLowerCase();
  const matching = rules.filter(
    (r) => r.agent === "*" || r.agent.toLowerCase() === ua,
  );

  return matching.some((r) => path.startsWith(r.path));
}

/**
 * Fetch robots.txt and check if the URL is allowed.
 *
 * @param {string} url - The target URL to check
 * @returns {Promise<{allowed: boolean, robotsUrl?: string}>}
 */
async function checkRobotsTxt(url) {
  const parsed = new URL(url);
  const robotsUrl = `${parsed.origin}/robots.txt`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      ROBOTS_TIMEOUT_MS,
    );

    const response = await fetch(robotsUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return { allowed: true };

    const text = await response.text();
    const rules = parseRobotsTxt(text);
    const disallowed = isPathDisallowed(rules, USER_AGENT, parsed.pathname);

    return { allowed: !disallowed, robotsUrl };
  } catch {
    return { allowed: true };
  }
}

export { parseRobotsTxt, isPathDisallowed, checkRobotsTxt };
