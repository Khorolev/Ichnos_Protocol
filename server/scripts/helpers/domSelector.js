/**
 * DOM-based CSS selector extraction for web content.
 *
 * Uses jsdom to parse HTML and querySelectorAll for reliable
 * CSS selector matching (tags, classes, IDs, descendants,
 * comma-separated selectors).
 *
 * @module domSelector
 */
import { JSDOM } from "jsdom";

/**
 * Extract matching elements' outerHTML from an HTML string.
 *
 * @param {string} html - Raw HTML content
 * @param {string} selectorString - CSS selectors, comma-separated
 * @returns {string|null} Combined outerHTML of matches, or null
 */
function extractBySelector(html, selectorString) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const selectors = selectorString
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const fragments = [];
  const seen = new Set();

  for (const sel of selectors) {
    const elements = document.querySelectorAll(sel);
    for (const el of elements) {
      const key = el.outerHTML;
      if (!seen.has(key)) {
        seen.add(key);
        fragments.push(key);
      }
    }
  }

  return fragments.length > 0 ? fragments.join("\n") : null;
}

export { extractBySelector };
