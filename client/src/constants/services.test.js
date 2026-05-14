import { describe, it, expect } from "vitest";

import {
  SERVICES_LIST,
  getServicesByPillar,
  getDeliveryMethodServices,
} from "./services";

describe("SERVICES_LIST", () => {
  it("has seven entries", () => {
    expect(SERVICES_LIST.length).toBe(7);
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
  it("returns two delivery-method services", () => {
    expect(getDeliveryMethodServices().length).toBe(2);
  });
});
