import { describe, it, expect } from "vitest";

import {
  SERVICES_LIST,
  getServicesByPillar,
  getDeliveryMethodServices,
} from "./services";

describe("SERVICES_LIST", () => {
  it("has six entries", () => {
    expect(SERVICES_LIST.length).toBe(6);
  });
});

describe("getServicesByPillar", () => {
  it("returns two engineering services", () => {
    expect(getServicesByPillar("engineering").length).toBe(2);
  });

  it("returns two compliance services", () => {
    expect(getServicesByPillar("compliance").length).toBe(2);
  });

  it("returns one circularity service", () => {
    expect(getServicesByPillar("circularity").length).toBe(1);
  });
});

describe("getDeliveryMethodServices", () => {
  it("returns one delivery-method service (Technical Lead, with agile PM merged)", () => {
    expect(getDeliveryMethodServices().length).toBe(1);
    expect(getDeliveryMethodServices()[0].id).toBe(
      "technical-lead-battery-systems",
    );
  });
});
