import { act, renderHook, waitFor } from "@testing-library/react";

import { LANDING_SECTION_IDS } from "../constants/navigation";
import { useActiveSection } from "./useActiveSection";

const observe = vi.fn();
const disconnect = vi.fn();

function mountLandingSections() {
  return (
    <>
      <section id="company">Company</section>
      <section id="services">Services</section>
      <section id="passport">Battery Passport</section>
      <section id="contact">Contact</section>
    </>
  );
}

function wrapper({ children }) {
  return (
    <div>
      {children}
      {mountLandingSections()}
    </div>
  );
}

describe("useActiveSection", () => {
  let observerCallback;

  beforeEach(() => {
    observe.mockReset();
    disconnect.mockReset();
    observerCallback = undefined;

    window.IntersectionObserver = vi.fn(
      function IntersectionObserverMock(callback) {
        observerCallback = callback;
        return {
          observe,
          disconnect,
        };
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts observing landing sections on initial mount after the sections are committed", async () => {
    const { result } = renderHook(
      () => useActiveSection(LANDING_SECTION_IDS, { enabled: true }),
      { wrapper },
    );

    await waitFor(() => {
      expect(observe).toHaveBeenCalledTimes(LANDING_SECTION_IDS.length);
    });

    LANDING_SECTION_IDS.forEach((id) => {
      expect(observe).toHaveBeenCalledWith(document.getElementById(id));
    });

    act(() => {
      observerCallback?.([
        { target: document.getElementById("company"), intersectionRatio: 0.3 },
        { target: document.getElementById("services"), intersectionRatio: 0.8 },
        { target: document.getElementById("passport"), intersectionRatio: 0.2 },
        { target: document.getElementById("contact"), intersectionRatio: 0.1 },
      ]);
    });

    expect(result.current).toBe("services");
  });
});
