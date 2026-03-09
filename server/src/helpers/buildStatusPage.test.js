import { describe, it, expect } from "vitest";
import buildStatusPage, { escapeHtml } from "./buildStatusPage.js";

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("a&b")).toBe("a&amp;b");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hi"')).toBe("say &quot;hi&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("escapes less-than", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes greater-than", () => {
    expect(escapeHtml("3>2")).toBe("3&gt;2");
  });

  it("handles all special characters together", () => {
    expect(escapeHtml(`<a href="x&y">it's</a>`)).toBe(
      "&lt;a href=&quot;x&amp;y&quot;&gt;it&#39;s&lt;/a&gt;"
    );
  });

  it("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("coerces non-string input to string", () => {
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml(null)).toBe("null");
    expect(escapeHtml(undefined)).toBe("undefined");
  });
});

describe("buildStatusPage", () => {
  const defaults = {
    clientOrigin: "https://example.com",
    env: "production",
    nodeVersion: "v20.0.0",
  };

  it("returns an HTML string", () => {
    const html = buildStatusPage(defaults);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Ichnos Protocol API");
  });

  it("includes the logo src from a valid https origin", () => {
    const html = buildStatusPage(defaults);
    expect(html).toContain('src="https://example.com/logo.png"');
  });

  it("includes the website link from a valid https origin", () => {
    const html = buildStatusPage(defaults);
    expect(html).toContain('href="https://example.com"');
  });

  it("omits logo src when origin has an unsafe scheme", () => {
    const html = buildStatusPage({
      ...defaults,
      clientOrigin: "javascript:alert(1)",
    });
    expect(html).not.toContain("javascript:");
    expect(html).toContain('src=""');
  });

  it("omits website href when origin has an unsafe scheme", () => {
    const html = buildStatusPage({
      ...defaults,
      clientOrigin: "data:text/html,<h1>evil</h1>",
    });
    expect(html).not.toContain("data:");
    expect(html).toContain('href=""');
  });

  it("escapes HTML-special characters in clientOrigin", () => {
    const html = buildStatusPage({
      ...defaults,
      clientOrigin: 'https://example.com/"evil"',
    });
    expect(html).not.toContain('"evil"');
    expect(html).toContain("&quot;evil&quot;");
  });

  it("escapes HTML-special characters in env", () => {
    const html = buildStatusPage({ ...defaults, env: "<script>alert(1)</script>" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML-special characters in nodeVersion", () => {
    const html = buildStatusPage({ ...defaults, nodeVersion: "v20&<>\"'" });
    expect(html).toContain("v20&amp;&lt;&gt;&quot;&#39;");
  });
});
