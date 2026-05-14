import { describe, it, expect } from "vitest";

import { SERVICES_LIST, getServicesByPillar } from "./services";

describe("SERVICES_LIST", () => {
  it("has six entries", () => {
    expect(SERVICES_LIST.length).toBe(6);
  });

  it("has no services flagged as deliveryMethod (Delivery Models pillar dropped)", () => {
    expect(SERVICES_LIST.every((s) => s.deliveryMethod === false)).toBe(true);
  });
});

describe("getServicesByPillar", () => {
  it("returns three engineering services (including Technical Lead)", () => {
    const engineering = getServicesByPillar("engineering");
    expect(engineering.length).toBe(3);
    expect(engineering.map((s) => s.id)).toContain(
      "technical-lead-battery-systems",
    );
  });

  it("returns two compliance services", () => {
    expect(getServicesByPillar("compliance").length).toBe(2);
  });

  it("returns one circularity service", () => {
    expect(getServicesByPillar("circularity").length).toBe(1);
  });
});
