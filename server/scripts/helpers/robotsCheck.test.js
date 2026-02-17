import { describe, it, expect } from "vitest";
import { parseRobotsTxt, isPathDisallowed } from "./robotsCheck.js";

describe("parseRobotsTxt", () => {
  it("parses disallow rules for wildcard agent", () => {
    const txt = `User-agent: *\nDisallow: /private\nDisallow: /admin`;
    const rules = parseRobotsTxt(txt);

    expect(rules).toHaveLength(2);
    expect(rules[0]).toEqual({ agent: "*", path: "/private" });
    expect(rules[1]).toEqual({ agent: "*", path: "/admin" });
  });

  it("parses rules for a specific user-agent", () => {
    const txt = [
      "User-agent: Googlebot",
      "Disallow: /no-google",
      "",
      "User-agent: *",
      "Disallow: /secret",
    ].join("\n");

    const rules = parseRobotsTxt(txt);

    expect(rules).toContainEqual({
      agent: "Googlebot",
      path: "/no-google",
    });
    expect(rules).toContainEqual({ agent: "*", path: "/secret" });
  });

  it("ignores comments and empty disallow values", () => {
    const txt = [
      "# This is a comment",
      "User-agent: *",
      "Disallow:",
      "Disallow: /blocked",
    ].join("\n");

    const rules = parseRobotsTxt(txt);

    expect(rules).toHaveLength(1);
    expect(rules[0].path).toBe("/blocked");
  });

  it("returns empty array for empty robots.txt", () => {
    expect(parseRobotsTxt("")).toEqual([]);
  });

  it("handles colons in disallow paths", () => {
    const txt = "User-agent: *\nDisallow: /path:with:colons";
    const rules = parseRobotsTxt(txt);

    expect(rules[0].path).toBe("/path:with:colons");
  });
});

describe("isPathDisallowed", () => {
  const rules = [
    { agent: "*", path: "/private" },
    { agent: "*", path: "/admin/" },
    { agent: "SpecialBot", path: "/special" },
  ];

  it("returns true for a disallowed path (wildcard)", () => {
    expect(isPathDisallowed(rules, "AnyBot", "/private")).toBe(true);
    expect(isPathDisallowed(rules, "AnyBot", "/private/page")).toBe(true);
  });

  it("returns false for an allowed path", () => {
    expect(isPathDisallowed(rules, "AnyBot", "/public")).toBe(false);
  });

  it("matches specific user-agent (case-insensitive)", () => {
    expect(isPathDisallowed(rules, "specialbot", "/special")).toBe(true);
    expect(isPathDisallowed(rules, "SPECIALBOT", "/special")).toBe(true);
  });

  it("does not match unrelated user-agent for specific rules", () => {
    expect(isPathDisallowed(rules, "OtherBot", "/special")).toBe(false);
  });

  it("returns false when rules array is empty", () => {
    expect(isPathDisallowed([], "AnyBot", "/anything")).toBe(false);
  });
});
