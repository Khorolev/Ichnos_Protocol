/*
 * Theme-scoping token assertions.
 *
 * Reads client/src/index.css as plain text and asserts that the
 * .theme-advisory and .theme-passport rule blocks each declare the
 * expected --color-bg-base token value. No DOM, no stylesheet injection.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_ADVISORY_BG = '#FAFBFC';
const EXPECTED_PASSPORT_BG = '#0A1628';

const INDEX_CSS_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'index.css',
);

function stripBlockComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

const CSS_SOURCE = stripBlockComments(readFileSync(INDEX_CSS_PATH, 'utf8'));

function extractBlockBySelector(css, selectorName) {
  let i = 0;
  while (i < css.length) {
    const openIdx = css.indexOf('{', i);
    if (openIdx === -1) return null;
    const closeIdx = css.indexOf('}', openIdx);
    if (closeIdx === -1) return null;
    const selectorList = css.slice(i, openIdx);
    const selectors = selectorList.split(',').map((s) => s.trim());
    if (selectors.includes(selectorName)) {
      return css.slice(openIdx + 1, closeIdx);
    }
    i = closeIdx + 1;
  }
  return null;
}

function getDeclaredValue(blockBody, propertyName) {
  const declarations = blockBody.split(';');
  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const name = decl.slice(0, colonIdx).trim();
    if (name === propertyName) {
      return decl.slice(colonIdx + 1).trim();
    }
  }
  return null;
}

describe('theme-scoping (index.css token assertions)', () => {
  it('declares --color-bg-base: #FAFBFC in the .theme-advisory block', () => {
    const block = extractBlockBySelector(CSS_SOURCE, '.theme-advisory');
    expect(block).toBeTruthy();
    const value = getDeclaredValue(block, '--color-bg-base');
    expect(value?.toUpperCase()).toBe(EXPECTED_ADVISORY_BG.toUpperCase());
  });

  it('declares --color-bg-base: #0A1628 in the .theme-passport block', () => {
    const block = extractBlockBySelector(CSS_SOURCE, '.theme-passport');
    expect(block).toBeTruthy();
    const value = getDeclaredValue(block, '--color-bg-base');
    expect(value?.toUpperCase()).toBe(EXPECTED_PASSPORT_BG.toUpperCase());
  });
});
