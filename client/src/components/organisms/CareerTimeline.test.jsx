import { axe } from "vitest-axe";
import { renderWithProviders, screen, cleanup } from "../../test-utils";
import CareerTimeline from "./CareerTimeline";
import { CAREER_TIMELINE_FRANCESCO } from "../../constants/teamTimelines";

describe("CareerTimeline", () => {
  const TIMELINE = [
    {
      id: "tl-1",
      year: 2018,
      title: "First Title",
      organization: "First Org",
      description: "First description.",
    },
    {
      id: "tl-2",
      year: 2020,
      title: "Second Title",
      organization: "Second Org",
      description: "Second description.",
    },
    {
      id: "tl-3",
      year: 2023,
      title: "Third Title",
      organization: "Third Org",
      description: "Third description.",
    },
  ];

  it("renders every entry from the given timeline prop", () => {
    const { container } = renderWithProviders(
      <CareerTimeline timeline={TIMELINE} />,
    );
    TIMELINE.forEach(({ year, title, organization, description }) => {
      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText(organization)).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
      expect(screen.getByText(String(year))).toBeInTheDocument();
    });
    expect(container.querySelectorAll(".timeline-item").length).toBe(
      TIMELINE.length,
    );
  });

  it("keeps the locked Francesco timeline entries intact", () => {
    expect(CAREER_TIMELINE_FRANCESCO).toHaveLength(9);
    expect(CAREER_TIMELINE_FRANCESCO[0].organization).toBe(
      "Ducati Motor Holding",
    );
    expect(CAREER_TIMELINE_FRANCESCO.at(-1)?.organization).toBe(
      "Ichnos Protocol Pte. Ltd.",
    );
    expect(
      CAREER_TIMELINE_FRANCESCO.find(({ id }) => id === "sigma-school-upskill"),
    ).toBeDefined();
    expect(
      CAREER_TIMELINE_FRANCESCO.find(({ id }) => id === "fev-lead-expert"),
    ).toEqual(
      expect.objectContaining({
        year: "2022 – 2025",
        organization: "FEV Europe GmbH",
      }),
    );
  });

  it("omits the connector on the last entry only", () => {
    const { container } = renderWithProviders(
      <CareerTimeline timeline={TIMELINE} />,
    );
    const items = container.querySelectorAll(".timeline-item");
    expect(items.length).toBe(TIMELINE.length);
    expect(
      items[items.length - 1].querySelector(".timeline-connector"),
    ).toBeNull();
    const precedingItems = Array.from(items).slice(0, -1);
    precedingItems.forEach((item) => {
      expect(item.querySelector(".timeline-connector")).not.toBeNull();
    });
  });

  it("renders cleanly with no items when timeline is empty", () => {
    const { container } = renderWithProviders(<CareerTimeline timeline={[]} />);
    expect(container.querySelectorAll(".timeline-item").length).toBe(0);
    expect(container.querySelectorAll(".timeline-connector").length).toBe(0);
    expect(
      screen.getByRole("heading", { name: "Career Highlights" }),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    cleanup();
    const { container } = renderWithProviders(
      <CareerTimeline timeline={TIMELINE} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
