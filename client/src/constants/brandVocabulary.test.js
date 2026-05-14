import { describe, it, expect } from "vitest";

import {
  PILLARS,
  PILLAR_ORDER,
  PILLAR_LIST,
  getPillar,
  getPillarBadgeLabel,
  BRAND_TAGLINE,
  BRAND_TAGLINE_LOWER,
  HERO_EYEBROW,
} from "./brandVocabulary";

describe("brandVocabulary — SSOT for brand strings", () => {
  it("has exactly three pillars in locked order", () => {
    expect(PILLAR_ORDER).toEqual(["engineering", "compliance", "circularity"]);
    expect(PILLAR_LIST.map((p) => p.id)).toEqual(PILLAR_ORDER);
  });

  it("every pillar has consistent id/label/badgeLabel/anchor casing", () => {
    PILLAR_LIST.forEach((p) => {
      expect(p.anchor).toBe(p.id);
      expect(p.label).toBe(p.id[0].toUpperCase() + p.id.slice(1));
      expect(p.badgeLabel).toBe(p.label.toUpperCase());
    });
  });

  it("getPillar returns the right pillar or null", () => {
    expect(getPillar("engineering")).toBe(PILLARS.engineering);
    expect(getPillar("compliance")).toBe(PILLARS.compliance);
    expect(getPillar("circularity")).toBe(PILLARS.circularity);
    expect(getPillar("not-a-pillar")).toBeNull();
  });

  it("getPillarBadgeLabel returns the SCREAMING label or null", () => {
    expect(getPillarBadgeLabel("engineering")).toBe("ENGINEERING");
    expect(getPillarBadgeLabel("compliance")).toBe("COMPLIANCE");
    expect(getPillarBadgeLabel("circularity")).toBe("CIRCULARITY");
    expect(getPillarBadgeLabel("not-a-pillar")).toBeNull();
  });

  it("BRAND_TAGLINE is the canonical title-case form", () => {
    expect(BRAND_TAGLINE).toBe("Engineering. Compliance. Circularity.");
  });

  it("BRAND_TAGLINE_LOWER is the canonical first-word-capitalised form", () => {
    expect(BRAND_TAGLINE_LOWER).toBe("Engineering, compliance, circularity.");
  });

  it("HERO_EYEBROW is the canonical hero eyebrow string", () => {
    expect(HERO_EYEBROW).toBe(
      "FROM REGULATORY COMPLIANCE TO REAL-WORLD CIRCULARITY",
    );
  });

  it("PILLARS is deeply frozen against accidental mutation", () => {
    expect(Object.isFrozen(PILLARS)).toBe(true);
    expect(Object.isFrozen(PILLARS.engineering)).toBe(true);
    expect(Object.isFrozen(PILLARS.compliance)).toBe(true);
    expect(Object.isFrozen(PILLARS.circularity)).toBe(true);
  });
});
