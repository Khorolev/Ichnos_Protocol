import { describe, it, expect } from "vitest";
import { extractBySelector } from "./domSelector.js";

const HTML = `<html><body>
  <header><nav>Nav</nav></header>
  <main><h1>Main Title</h1><p>Main content</p></main>
  <article class="post"><p>Article text</p></article>
  <div id="sidebar"><span>Side</span></div>
  <section class="post"><div class="inner"><p>Nested</p></div></section>
  <footer>Footer</footer>
</body></html>`;

describe("extractBySelector", () => {
  it("extracts a single tag selector", () => {
    const result = extractBySelector(HTML, "main");

    expect(result).toContain("Main Title");
    expect(result).toContain("Main content");
    expect(result).not.toContain("Footer");
  });

  it("extracts comma-separated selectors", () => {
    const result = extractBySelector(HTML, "main, article");

    expect(result).toContain("Main Title");
    expect(result).toContain("Article text");
    expect(result).not.toContain("Footer");
  });

  it("extracts by class selector", () => {
    const result = extractBySelector(HTML, ".post");

    expect(result).toContain("Article text");
    expect(result).toContain("Nested");
  });

  it("extracts by ID selector", () => {
    const result = extractBySelector(HTML, "#sidebar");

    expect(result).toContain("Side");
    expect(result).not.toContain("Main content");
  });

  it("extracts with descendant selector", () => {
    const result = extractBySelector(HTML, "section .inner p");

    expect(result).toContain("Nested");
    expect(result).not.toContain("Article text");
  });

  it("returns null when no elements match", () => {
    const result = extractBySelector(HTML, ".nonexistent");

    expect(result).toBeNull();
  });

  it("deduplicates matching elements", () => {
    const result = extractBySelector(HTML, "main, main");

    const count = (result.match(/Main Title/g) || []).length;
    expect(count).toBe(1);
  });

  it("handles whitespace in selector string", () => {
    const result = extractBySelector(HTML, "  main , article  ");

    expect(result).toContain("Main Title");
    expect(result).toContain("Article text");
  });
});
